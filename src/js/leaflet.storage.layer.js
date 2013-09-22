L.Storage.DataLayer = L.LazyGeoJSON.extend({

    initialize: function (map, /* Object from db */ datalayer, options) {
        this.map = map;
        this._index = Array();
        if(typeof options == "undefined") {
            options = {};
        }
        L.LazyGeoJSON.prototype.initialize.call(this, this._dataGetter, options);
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
        if (!this.storage_id) {
            this.isDirty = true;
        }
    },

    populate: function (datalayer) {
        // Datalayer is null when listening creation form
        if (!this.storage_id && datalayer && datalayer.pk) {
            this.storage_id = datalayer.pk || null;
        }
        L.Util.extend(this.options, datalayer || {});
        this.connectToMap();
    },

    connectToMap: function () {
        var id = L.stamp(this);
        if (!this.map.datalayers[id]) {
            this.map.datalayers[id] = this;
            this.map.datalayers_index.push(this);
        }
        if(this.options.displayOnLoad) {
            this.map.addLayer(this);
        }
        this.map.updateDatalayersControl();
    },

    _dataUrl: function() {
        var template = this.map.options.urls.datalayer_view;
        return L.Util.template(template, {"pk": this.storage_id});
    },

    _dataGetter: function (callback) {
        L.Storage.Xhr.get(this._dataUrl(), {"callback": callback});
    },

    addLayer: function (feature) {
        feature.connectToDataLayer(this);
        this._index.push(L.stamp(feature));
        return L.LazyGeoJSON.prototype.addLayer.call(this, feature);
    },

    removeLayer: function (feature) {
        feature.disconnectFromDataLayer(this);
        this._index.splice(this._index.indexOf(L.stamp(feature)), 1);
        return L.LazyGeoJSON.prototype.removeLayer.call(this, feature);
    },

    addData: function (geojson) {
        // We override it, because we need to take control of
        // creating Polylines ; currently, only points creation is
        // configurable, with pointToLayer
        // FIXME when more hooks are available in leaflet
        if (geojson._storage) {
            this.populate(geojson._storage);
        }
        return this.geojsonToFeatures(geojson);
    },

    geojsonToFeatures: function (geojson) {
        var features = geojson instanceof Array ? geojson : geojson.features,
            i, len;

        if (features) {
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
            default:
                throw new Error(L._("Unkown geometry.type: {type}", {type: geometry.type}));
        }
        return this.addLayer(layer);
    },

    _pointToLayer: function(geojson, latlng) {
        if(this.options.pointToLayer) {
            return options.pointToLayer(geojson, latlng);
        }
        return L.storage_marker(
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
        this.map.removeLayer(this);
        delete this.map.datalayers[L.stamp(this)];
        this.map.datalayers_index.splice(this.map.datalayers_index.indexOf(this), 1);
        this.map.updateDatalayersControl();
        this._geojson = null;
        this._layers = {};
        this._index = Array();
    },

    reset: function () {
        if (this.storage_id) {
            this.map.removeLayer(this);
            this.clearLayers();
            if (this._geojson) {
                this.fromGeoJSON(this._geojson);
            }
            this.map.addLayer(this);
        } else {
            this.erase();
        }
    },

    redraw: function () {
        this.map.removeLayer(this);
        this.map.addLayer(this);
    },

    edit: function () {
        if(!this.map.editEnabled) return;
        var self = this,
            container = L.DomUtil.create('div'),
            metadata_fields = [
                'options.name',
                'options.description'
            ];
        var builder = new L.S.FormBuilder(this, metadata_fields, {
            callback: function () { this.map.updateDatalayersControl(); },
            callbackContext: this
        });
        form = builder.build();
        container.appendChild(form);
        var options_fields = [
            ['options.color', 'ColorPicker'],
            ['options.iconClass', 'IconClassSwitcher'],
            ['options.iconUrl', 'IconUrl'],
            'options.smoothFactor',
            'options.opacity',
            ['options.stroke', 'NullableBoolean'],
            'options.weight',
            ['options.fill', 'NullableBoolean'],
            ['options.fillColor', 'ColorPicker'],
            'options.fillOpacity',
            'options.dashArray'
        ];
        builder = new L.S.FormBuilder(this, options_fields, {
            callback: this.redraw,
            callbackContext: this
        });
        form = builder.build();
        container.appendChild(form);
        var deleteLink = L.DomUtil.create('a', 'delete_datalayer_button', container);
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

    fetchData: function () {
        if (!this.storage_id) {
            return;
        }
        L.LazyGeoJSON.prototype.fetchData.call(this);
    },

    display: function () {
        this.map.addLayer(this);
        // this._map.fire('overlayadd', {layer: obj});
    },

    hide: function () {
        this.map.removeLayer(this);
        // this._map.fire('overlayremove', {layer: obj});
    },

    toggle: function () {
        if (!this.map.hasLayer(this)) {
            this.display();
        }
        else {
            this.hide();
        }
    },

    zoomTo: function () {
        var bounds = this.getBounds();
        if (bounds.isValid()) {
            this.map.fitBounds(bounds);
        }
    },

    isVisible: function () {
        return this.map.hasLayer(this);
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
        var geojson = {
            type: "FeatureCollection",
            features: this.featuresToGeoJSON(),
            _storage: this.options
        };
        this._geojson = geojson;
        var formData = new FormData();
        formData.append("name", this.options.name);
        formData.append("data", JSON.stringify(geojson));
        L.Storage.Xhr.post(this.getSaveUrl(), {
            data: formData,
            callback: function (data) {this.populate(data);},
            context: this
        });
    },

    saveDelete: function () {
        L.S.Xhr.post(this.getDeleteUrl());
    }

});

L.TileLayer.include({

    toJSON: function () {
        return {
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom,
            attribution: this.options.attribution,
            url_template: this._url
        };
    }
});