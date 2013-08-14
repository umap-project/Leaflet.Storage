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
        this.connectToMap();
    },

    populate: function (datalayer) {
        // Datalayer is null when listening creation form
        this.storage_id = datalayer.pk || null;
        this.options.name = datalayer.name || "layer no name";
        this.options.description = datalayer.description || "";
        this.options.iconClass = datalayer.icon_class || this.map.getDefaultOption('iconClass');
        this.options.iconUrl = datalayer.pictogram_url || null;
        this.options.displayOnLoad = datalayer.display_on_load || false;
        L.Util.extend(this.options, datalayer.options);
        if (!this.storage_id) {
            this.isDirty = true;
        }
    },

    connectToMap: function () {
        var id = L.stamp(this);
        this.map.datalayers[id] = this;
        this.map.datalayers_index.push(this);
        if(this.options.displayOnLoad) {
            this.map.addLayer(this);
        }
        this.map.datalayers_control.update();
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
        var features = geojson instanceof Array ? geojson : geojson.features,
            i, len;

        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                this.addData(features[i]);
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

    getEditUrl: function(){
        return L.Util.template(this.map.options.urls.datalayer_update, {'map_id': this.map.options.storage_id, 'pk': this.storage_id});
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

    getDeleteURL: function () {
        return L.Util.template(this.map.options.urls.datalayer_delete, {'pk': this.storage_id, 'map_id': this.map.options.storage_id});

    },

    confirmDelete: function() {
        if(!this.map.editEnabled) return;
        var url = this.getDeleteURL();
        var self = this;
        L.Storage.Xhr.get(url, {
            "callback": function(data){
                L.Storage.fire('ui:start', {'data': data, 'cssClass': 'warning'});
                self.listenDeleteForm();
            }
        });
    },

    listenDeleteForm: function() {
        var form = L.DomUtil.get("datalayer_delete");
        var self = this;
        var manage_ajax_return = function (data) {
            if (data.error) {
                L.Storage.fire('ui:alert', {'content': data.error, 'level': 'error'});
            }
            else if (data.info) {
                self._delete();
                L.Storage.fire('ui:alert', {'content': data.info, 'level': 'info'});
                L.Storage.fire('ui:end');
            }
        };
        var submit = function (e) {
            form.action = self.getDeleteURL();
            L.Storage.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
        };
        L.DomEvent.on(form, 'submit', submit);
    },

    _delete: function () {
        this.reset();
    },

    erase: function () {
        this.map.removeLayer(this);
        delete this.map.datalayers[L.stamp(this)];
        this.map.datalayers_index.splice(this.map.datalayers_index.indexOf(this), 1);
        this.map.datalayers_control.update();
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
                this.map.addLayer(this);
            }
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
            callback: function () { this.map.datalayers_control.update(); },
            callbackContext: this
        });
        form = builder.build();
        container.appendChild(form);
        var options_fields = [
            ['options.color', 'ColorPicker'],
            ['options.iconClass', 'IconClassSwitcher'],
            ['options.iconUrl', 'iconUrl'],
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
        L.S.fire('ui:start', {data: {html: container}});

    },

    _handleEditResponse: function(data) {
        var map = this.map,
            form_id = "datalayer_edit",
            self = this;
        L.Storage.fire('ui:start', {'data': data});
        var iconHelper = new L.Storage.FormHelper.IconField(this.map, form_id, {
            iconUrl: this.iconUrl || this.map.getDefaultOption('iconUrl'),
            iconColor: this.options.color || this.map.getDefaultOption('color'),
            iconClass: this.getIconClass()
        });
        var colorHelper = new L.Storage.FormHelper.Color(this.map, form_id, {
            color: this.options.color || this.map.getDefaultOption('color')
        });
        console.log(this.featuresToGeoJSON());
        L.Storage.Xhr.listen_form(form_id, {
            'callback': function (data) {
                if (data.datalayer) {
                    /* Means success */
                    if (self.storage_id) {
                        // TODO update instead of removing/recreating
                        self.reset();
                    }
                    self.populate(data.datalayer);
                    // force display_on_load not to get the layer hidden while
                    // working on it
                    self.options.displayOnLoad = true;
                    self.connectToMap();
                    L.Storage.fire('ui:alert', {'content': L._("Layer successfuly edited"), 'level': 'info'});
                    L.Storage.fire('ui:end');
                }
                else {
                    // Let's start again
                    self._handleEditResponse(data);
                }
            }
        });
        var delete_link = L.DomUtil.get("delete_datalayer_button");
        if (delete_link) {
            L.DomEvent
                .on(delete_link, 'click', L.DomEvent.stopPropagation)
                .on(delete_link, 'click', L.DomEvent.preventDefault)
                .on(delete_link, 'click', this.confirmDelete, this);
        }
    },

    featuresToGeoJSON: function () {
        var features = [];
        this.eachLayer(function (layer) {
            features.push(layer.toGeoJSON());
        });
        return {
            type: 'FeatureCollection',
            features: features
        };
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
        // save in db
        console.log("saving", geojson);
    }

});
