L.Storage.DataLayer = L.Class.extend({

    includes: [L.Mixin.Events],

    options: {
        displayOnLoad: true
    },

    initialize: function (map, datalayer, options) {
        this.map = map;
        this._index = Array();
        this._layers = {};
        this._geojson = null;
        L.Util.setOptions(this, options);

        var isDirty = false,
            self = this;
        try {
            Object.defineProperty(this, 'isDirty', {
                get: function () {
                    return isDirty;
                },
                set: function (status) {
                    if (!isDirty && status) {
                        self.fire('isdirty');
                    }
                    isDirty = status;
                    self.map.isDirty = status;
                }
            });
        }
        catch (e) {
            // Certainly IE8, which has a limited version of defineProperty
        }
        this.populate(datalayer);
        this.connectToMap();
        if(this.options.displayOnLoad) {
            this.display();
        }
        if (!this.storage_id) {
            this.isDirty = true;
        }
        this.onceLoaded(function () {
            this.map.on('moveend', function (e) {
                if (this.isRemoteLayer() && this.options.remoteData.dynamic && this.isVisible()) {
                    this.fetchRemoteData();
                }
            }, this);
        });
    },

    resetLayer: function () {
        if (this.layer && ((this.layer instanceof L.MarkerClusterGroup && this.isClustered()) ||
            (!this.isClustered() && !(this.layer instanceof L.MarkerClusterGroup)))) {
            return;
        }
        var visible = this.isVisible(), self = this;
        if (visible) {
            this.map.removeLayer(this.layer);
        }
        if (this.layer) {
            this.layer.clearLayers();
        }
        if (this.isClustered()) {
            this.layer = new L.MarkerClusterGroup({
                polygonOptions: {
                    color: this.options.color || this.map.getDefaultOption('color')
                },
                iconCreateFunction: function (cluster) {
                    return new L.Storage.Icon.Cluster(self, cluster);
                }
            });
        } else {
            this.layer = new L.FeatureGroup();
        }
        this.eachLayer(function (layer) {
            this.layer.addLayer(layer);
        });
        if (visible) {
            this.map.addLayer(this.layer);
        }
    },

    eachLayer: function (method, context) {
        for (var i in this._layers) {
            method.call(context || this, this._layers[i]);
        }
        return this;
    },

    fetchData: function () {
        if (!this.storage_id) {
            return;
        }
        this.map.get(this._dataUrl(), {
            callback: function (geojson) {
                if (geojson._storage) {
                    this.resetOptions(geojson._storage);
                }
                if (this.isRemoteLayer()) {
                    this.fetchRemoteData();
                } else {
                    this.fromGeoJSON(geojson);
                }
            },
            context: this
        });
    },

    fromGeoJSON: function (geojson) {
        this.addData(geojson);
        this._geojson = geojson;
        this.fire('dataloaded');
    },

    clear: function () {
        this.layer.clearLayers();
        this._layers = {};
    },

    fetchRemoteData: function () {
        if ((!isNaN(this.options.remoteData.from) && this.map.getZoom() < this.options.remoteData.from) ||
            (!isNaN(this.options.remoteData.to) && this.map.getZoom() > this.options.remoteData.to) ) {
            this.clear();
            return;
        }
        var self = this;
        this._geojson = {}; // Should appear as loaded (and so editable) even if xhr goes in error
                            // du to user missconfigurating the remote URL
        this.map.ajax({
            uri: this.map.localizeUrl(this.options.remoteData.url),
            verb: 'GET',
            callback: function (raw) {
                self.clear();
                self.rawToGeoJSON(raw, self.options.remoteData.format, function (geojson) {self.fromGeoJSON(geojson);});
            }
        });
    },

    onceLoaded: function (callback, context) {
        if (this.isLoaded()) {
            callback.call(context || this, this);
        } else {
            this.once('dataloaded', callback, context);
        }
        return this;
    },

    isLoaded: function () {
        return !this.storage_id || this._geojson !== null;
    },

    populate: function (datalayer) {
        // Datalayer is null when listening creation form
        if (!this.storage_id && datalayer && datalayer.id) {
            this.storage_id = datalayer.id || null;
        }
        L.Util.setOptions(this, datalayer);
        this.resetLayer();
    },

    resetOptions: function (options) {
        this.options = L.Util.extend({}, options);
        this.resetLayer();
    },

    connectToMap: function () {
        var id = L.stamp(this);
        if (!this.map.datalayers[id]) {
            this.map.datalayers[id] = this;
            this.map.datalayers_index.push(this);
        }
        this.map.updateDatalayersControl();
    },

    _dataUrl: function() {
        var template = this.map.options.urls.datalayer_view;
        return L.Util.template(template, {"pk": this.storage_id, "map_id": this.map.options.storage_id});
    },

    isRemoteLayer: function () {
        return !!(this.options.remoteData && this.options.remoteData.url && this.options.remoteData.format);
    },

    isClustered: function () {
        return !!this.options.markercluster;
    },

    addLayer: function (feature) {
        var id = L.stamp(feature);
        feature.connectToDataLayer(this);
        this._index.push(id);
        this._layers[id] = feature;
        this.layer.addLayer(feature);
    },

    removeLayer: function (feature) {
        var id = L.stamp(feature);
        feature.disconnectFromDataLayer(this);
        this._index.splice(this._index.indexOf(id), 1);
        delete this._layers[id];
        this.layer.removeLayer(feature);
    },

    addData: function (geojson) {
        this.geojsonToFeatures(geojson);
    },

    addRawData: function (c, type) {
        var self = this;
        this.rawToGeoJSON(c, type, function (geojson) {
            self.addData(geojson);
        });
    },

    rawToGeoJSON: function (c, type, callback) {
        var self = this,
            toDom = function (x) {
                return (new DOMParser()).parseFromString(x, 'text/xml');
            };

        // TODO add a duck typing guessType
        if (type === "csv") {
            csv2geojson.csv2geojson(c, {
                delimiter: 'auto',
                includeLatLon: false
            }, function(err, result) {
                if (err) {
                    L.S.fire('ui:alert', {content: 'error in csv', level: 'error'});
                } else {
                    callback(result);
                }
            });
        } else if (type === 'gpx') {
            callback(toGeoJSON.gpx(toDom(c)));
        } else if (type === 'kml') {
            callback(toGeoJSON.kml(toDom(c)));
        } else if (type === 'osm') {
            callback(osm_geojson.osm2geojson(toDom(c)));
        } else if (type === "geojson") {
            try {
                gj = JSON.parse(c);
                callback(gj);
            } catch(err) {
                L.S.fire('ui:alert', {content: 'Invalid JSON file: ' + err});
                return;
            }
        }
    },

    geojsonToFeatures: function (geojson) {
        var features = geojson instanceof Array ? geojson : geojson.features,
            i, len;

        if (features) {
            features.sort(function (a, b) {
                if (!a.properties.name && ! b.properties.name) {
                    return 0;
                } else if (!a.properties.name) {
                    return -1;
                } else if (!b.properties.name) {
                    return 1;
                }
                return a.properties.name.localeCompare(b.properties.name);
            });
            for (i = 0, len = features.length; i < len; i++) {
                this.geojsonToFeatures(features[i]);
            }
            return this;
        }

        var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
            coords = geometry.coordinates,
            layer;

        switch (geometry.type) {
            case 'Point':
                latlng = L.GeoJSON.coordsToLatLng(coords);
                layer = this._pointToLayer(geojson, latlng);
                break;
            case 'LineString':
                latlngs = L.GeoJSON.coordsToLatLngs(coords);
                layer = this._lineToLayer(geojson, latlngs);
                break;
            case 'Polygon':
                latlngs = L.GeoJSON.coordsToLatLngs(coords, 1);
                layer = this._polygonToLayer(geojson, latlngs);
                break;
            case 'MultiPolygon':
                // Hack: we handle only MultiPolygon with one polygon
                if (coords.length === 1) {
                    latlngs = L.GeoJSON.coordsToLatLngs(coords[0], 1);
                    layer = this._polygonToLayer(geojson, latlngs);
                    break;
                }
            default:
                L.S.fire('ui:alert', {content: L._("Skipping unkown geometry.type: {type}", {type: geometry.type}), level: 'error'});
        }
        if (layer) {
            this.addLayer(layer);
            return layer;
        }
    },

    _pointToLayer: function(geojson, latlng) {
        if(this.options.pointToLayer) {
            return options.pointToLayer(geojson, latlng);
        }
        return new L.Storage.Marker(
            this.map,
            latlng,
            {"geojson": geojson, "datalayer": this}
        );
    },

    _lineToLayer: function(geojson, latlngs) {
        return new L.Storage.Polyline(
            this.map,
            latlngs,
            {"geojson": geojson, "datalayer": this, color: null}
        );
    },

    _polygonToLayer: function(geojson, latlngs) {
        return new L.Storage.Polygon(
            this.map,
            latlngs,
            {"geojson": geojson, "datalayer": this}
        );
    },

    getEditUrl: function() {
        return L.Util.template(this.map.options.urls.datalayer_update, {'map_id': this.map.options.storage_id, 'pk': this.storage_id});
    },

    getCreateUrl: function() {
        return L.Util.template(this.map.options.urls.datalayer_create, {'map_id': this.map.options.storage_id});
    },

    getSaveUrl: function () {
        return (this.storage_id && this.getEditUrl()) || this.getCreateUrl();
    },

    getIconClass: function () {
        var iconClass = this.map.getDefaultOption('iconClass');
        if(L.Storage.Icon[this.options.iconClass]) {
            iconClass = this.options.iconClass;
        }
        return iconClass;
    },

    getIcon: function () {
        return new L.Storage.Icon[this.getIconClass()](this.map);
    },

    getDeleteUrl: function () {
        return L.Util.template(this.map.options.urls.datalayer_delete, {'pk': this.storage_id, 'map_id': this.map.options.storage_id});

    },

    _delete: function () {
        if (this.storage_id) {
            this.map.deleted_datalayers.push(this);
        }
        this.erase();
        this.isDirty = true;
    },

    erase: function () {
        this.hide();
        delete this.map.datalayers[L.stamp(this)];
        this.map.datalayers_index.splice(this.map.datalayers_index.indexOf(this), 1);
        this.map.updateDatalayersControl();
        this._layers = {};
        this._index = Array();
    },

    reset: function () {
        if (this.storage_id) {
            this.hide();
            this.clear();
            if (this.isRemoteLayer()) {
                this.fetchRemoteData();
            } else if (this._geojson) {
                this.resetOptions(this._geojson._storage);
                this.fromGeoJSON(this._geojson);
            }
            this.display();
            this.isDirty = false;
        } else {
            this.erase();
        }
    },

    redraw: function () {
        this.hide();
        this.display();
    },

    edit: function () {
        if(!this.map.editEnabled || !this.isLoaded()) {return;}
        var self = this,
            container = L.DomUtil.create('div'),
            metadata_fields = [
                'options.name',
                'options.description',
                ['options.displayOnLoad', {label: L._('Display on load'), handler: 'CheckBox'}]
            ];
        var builder = new L.S.FormBuilder(this, metadata_fields, {
            callback: function () { this.map.updateDatalayersControl(); },
            callbackContext: this
        });
        form = builder.build();
        container.appendChild(form);
        var optionsFields = [
            'options.color',
            'options.iconClass',
            'options.iconUrl',
            'options.smoothFactor',
            'options.opacity',
            'options.stroke',
            'options.weight',
            'options.fill',
            'options.fillColor',
            'options.fillOpacity',
            'options.dashArray',
            'options.popupTemplate',
            ['options.markercluster', {handler: 'CheckBox', label: L._('Cluster markers')}],
        ];

        builder = new L.S.FormBuilder(this, optionsFields, {
            id: 'datalayer-advanced-properties',
            callback: function (field) {
                this.hide();
                if (field === "options.markercluster") {
                    this.resetLayer();
                }
                if (field === "options.color" && this.isClustered()) {
                    this.layer.options.polygonOptions.color = this.options.color || this.map.getDefaultOption('color');
                }
                this.display();
            }
        });
        var advancedProperties = L.DomUtil.createFieldset(container, L._('Advanced properties'));
        form = builder.build();
        advancedProperties.appendChild(form);

        if (!L.Util.isObject(this.options.remoteData)) {
            this.options.remoteData = {};
        }
        var remoteDataFields = [
            ['options.remoteData.url', {handler: 'Url', label: L._('Url'), helpEntries: 'formatURL'}],
            ['options.remoteData.format', {handler: 'DataFormat', label: L._('Format')}],
            ['options.remoteData.from', {label: L._('From zoom'), helpText: L._('Optionnal.')}],
            ['options.remoteData.to', {label: L._('To zoom'), helpText: L._('Optionnal.')}],
            ['options.remoteData.dynamic', {handler: 'CheckBox', label: L._('Dynamic')}],
            ['options.remoteData.licence', {label: L._('Licence'), helpText: L._('Please be sure the licence is compliant with your use.')}]
        ];

        var remoteDataContainer = L.DomUtil.createFieldset(container, L._('Remote data'));
        builder = new L.S.FormBuilder(this, remoteDataFields);
        remoteDataContainer.appendChild(builder.build());

        var advancedActions = L.DomUtil.createFieldset(container, L._('Advanced actions'));
        var deleteLink = L.DomUtil.create('a', 'delete_datalayer_button', advancedActions);
        deleteLink.innerHTML = L._('Delete');
        deleteLink.href = "#";
        L.DomEvent.on(deleteLink, 'click', L.DomEvent.stop)
                  .on(deleteLink, 'click', function () {
                    this._delete();
                    L.S.fire('ui:end');
                }, this);
        L.S.fire('ui:start', {data: {html: container}});

    },

    featuresToGeoJSON: function () {
        var features = [];
        this.eachLayer(function (layer) {
            features.push(layer.toGeoJSON());
        });
        return features;
    },

    display: function () {
        if(!this.isLoaded()) {
            this.fetchData();
        }
        this.map.addLayer(this.layer);
        this.fire('display');
        // this._map.fire('overlayadd', {layer: obj});
    },

    hide: function () {
        this.map.removeLayer(this.layer);
        this.fire('hide');
        // this._map.fire('overlayremove', {layer: obj});
    },

    toggle: function () {
        if (!this.isVisible()) {
            this.display();
        }
        else {
            this.hide();
        }
    },

    zoomTo: function () {
        if (!this.isVisible()) {
            return;
        }
        var bounds = this.layer.getBounds();
        if (bounds.isValid()) {
            this.map.fitBounds(bounds);
        }
    },

    isVisible: function () {
        return this.map.hasLayer(this.layer);
    },

    getFeatureByIndex: function (index) {
        if (index === -1) {
            index = this._index.length - 1;
        }
        var id = this._index[index];
        return this._layers[id];
    },

    getNextFeature: function (feature) {
        var id = this._index.indexOf(L.stamp(feature)),
            nextId = this._index[id + 1];
        return nextId? this._layers[nextId]: this.getNextVisible().getFeatureByIndex(0);
    },

    getPreviousFeature: function (feature) {
        if (this._index <= 1) { return null; }
        var id = this._index.indexOf(L.stamp(feature)),
            previousId = this._index[id - 1];
        return previousId? this._layers[previousId]: this.getPreviousVisible().getFeatureByIndex(-1);
    },

    getNextVisible: function () {
        var id = this.map.datalayers_index.indexOf(this),
            next = this.map.datalayers_index[id + 1] || this.map.datalayers_index[0];
        while(!next.isVisible() || next._index.length === 0) {
            next = next.getNextVisible();
        }
        return next;
    },

    getPreviousVisible: function () {
        var id = this.map.datalayers_index.indexOf(this),
            prev = this.map.datalayers_index[id - 1] || this.map.datalayers_index[this.map.datalayers_index.length - 1];
        while(!prev.isVisible() || prev._index.length === 0) {
            prev = prev.getPreviousVisible();
        }
        return prev;
    },

    save: function () {
        if (!this.isLoaded()) {return;}
        var geojson = {
            type: "FeatureCollection",
            features: this.isRemoteLayer() ? [] : this.featuresToGeoJSON(),
            _storage: this.options
        };
        this._geojson = geojson;
        var formData = new FormData();
        formData.append("name", this.options.name);
        formData.append("display_on_load", !!this.options.displayOnLoad);
        // filename support is shaky, don't do it for now
        var blob = new Blob([JSON.stringify(geojson)], {type: 'application/json'});
        formData.append("geojson", blob);
        this.map.post(this.getSaveUrl(), {
            data: formData,
            callback: function (data) {
                this.populate(data);
                this.connectToMap();
                this.reset();  // Needed for reordering features
            },
            context: this
        });
    },

    saveDelete: function () {
        L.S.Xhr.post(this.getDeleteUrl());
    },

    getMap: function () {
        return this.map;
    },

    getName: function () {
        return this.options.name || L._('Untitled layer');
    },

    renderToolbox: function (container) {
        var toggle = L.DomUtil.create('i', 'layer-toggle', container),
            zoom_to = L.DomUtil.create('i', 'layer-zoom_to', container),
            edit = L.DomUtil.create('i', "layer-edit show-on-edit", container);
        zoom_to.title = L._('Zoom to layer extent');
        toggle.title = L._('Show/hide layer');
        edit.title = L._('Edit');
        L.DomEvent.on(toggle, 'click', this.toggle, this);
        L.DomEvent.on(zoom_to, 'click', this.zoomTo, this);
        L.DomEvent.on(edit, 'click', this.edit, this);
    }

});

L.TileLayer.include({

    toJSON: function () {
        return {
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom,
            attribution: this.options.attribution,
            url_template: this._url,
            name: this.options.name,
            tms: this.options.tms
        };
    },

    getAttribution: function () {
        return L.Util.toHTML(this.options.attribution);
    }

});