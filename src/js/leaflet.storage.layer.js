L.Storage.Layer = L.LazyGeoJSON.extend({

    initialize: function (map, /* Object from db */ category, options) {
        this.default_icon_class = "Default";
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        L.LazyGeoJSON.prototype.initialize.call(this, this._dataGetter, options);
        this.populate(category);
        this.connectToMap();
    },

    populate: function (category) {
        // Category is null when listening creation form
        this.storage_id = category.pk || null;
        this.storage_name = category.name || "";
        this.storage_icon_class = category.icon_class || this.default_icon_class;
        this.iconUrl = category.pictogram_url || null;
        this.display_on_load = category.display_on_load || false;
        L.Util.extend(this.options, category.options);
    },

    connectToMap: function () {
        if (this.storage_id) {
            this.map.storage_overlays[this.storage_id] = this;
            if(this.display_on_load) {
                this.map.addLayer(this);
            }
            this.map.storage_layers_control.addOverlay(this, this.storage_name);
        }
    },

    _dataUrl: function() {
        var template = this.map.options.urls.feature_geojson_list;
        return L.Util.template(template, {"category_id": this.storage_id});
    },

    _dataGetter: function (callback) {
        L.Storage.Xhr.get(this._dataUrl(), {"callback": callback});
    },

    addLayer: function (layer) {
        layer.connectToOverlay(this);
        return L.LazyGeoJSON.prototype.addLayer.call(this, layer);
    },

    removeLayer: function (layer) {
        layer.disconnectFromOverlay(this);
        return L.LazyGeoJSON.prototype.removeLayer.call(this, layer);
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
                throw new Error(L.S._("Unkown geometry.type: {type}", {type: geometry.type}));
        }
        return this.addLayer(layer);
    },
    _pointToLayer: function(geojson, latlng) {
        if(this.options.pointToLayer) {
            return options.pointToLayer(geojson, latlng);
        }
        return L.storage_marker(
            this.map,
            geojson.id,
            latlng,
            {"geojson": geojson, "overlay": this}
        );
    },
    _lineToLayer: function(geojson, latlngs) {
        return new L.Storage.Polyline(
            this.map,
            geojson.id,
            latlngs,
            {"geojson": geojson, "overlay": this}
        );
    },

    _polygonToLayer: function(geojson, latlngs) {
        return new L.Storage.Polygon(
            this.map,
            geojson.id,
            latlngs,
            {"geojson": geojson, "overlay": this}
        );
    },

    getEditUrl: function(){
        return L.Util.template(this.map.options.urls.category_update, {'map_id': this.map.options.storage_id, 'pk': this.storage_id});
    },

    getIconClass: function () {
        var iconClass = this.default_icon_class;
        if(L.Storage.Icon[this.storage_icon_class]) {
            iconClass = this.storage_icon_class;
        }
        return iconClass;
    },

    getIcon: function () {
        return new L.Storage.Icon[this.getIconClass()](this.map);
    },

    getDeleteURL: function () {
        return L.Util.template(this.map.options.urls.category_delete, {'pk': this.storage_id, 'map_id': this.map.options.storage_id});

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
        var form = L.DomUtil.get("category_delete");
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

    reset: function () {
        map.removeLayer(this);
        map.storage_layers_control.removeLayer(this);
        this._geojson = null;
        this._layers = {};
    },

    _handleEditResponse: function(data) {
        var map = this.map,
            form_id = "category_edit",
            self = this;
        L.Storage.fire('ui:start', {'data': data});
        var listener = new L.Storage.FormListener.IconField(this.map, form_id, {
            iconUrl: this.iconUrl || this.map.getDefaultOption('iconUrl'),
            iconColor: this.options.color || this.map.getDefaultOption('color'),
            iconClass: this.getIconClass()
        });
        L.Storage.Xhr.listen_form(form_id, {
            'callback': function (data) {
                if (data.category) {
                    /* Means success */
                    if (self.storage_id) {
                        // TODO update instead of removing/recreating
                        self.reset();
                    }
                    self.populate(data.category);
                    // force display_on_load not to get the layer hidden while
                    // working on it
                    self.display_on_load = true;
                    self.connectToMap();
                    L.Storage.fire('ui:alert', {'content': L.S._("Category successfuly edited"), 'level': 'info'});
                    L.Storage.fire('ui:end');
                }
                else {
                    // Let's start again
                    self._handleEditResponse(data);
                }
            }
        });
        var delete_link = L.DomUtil.get("delete_category_button");
        if (delete_link) {
            L.DomEvent
                .on(delete_link, 'click', L.DomEvent.stopPropagation)
                .on(delete_link, 'click', L.DomEvent.preventDefault)
                .on(delete_link, 'click', this.confirmDelete, this);
        }
    }

});
