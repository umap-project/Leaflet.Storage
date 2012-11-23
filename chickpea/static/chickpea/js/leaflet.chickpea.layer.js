L.ChickpeaLayer = L.LazyGeoJSON.extend({
    initialize: function (/* Object from db */ category, map, options) {
        this.chickpea_id = category.pk;
        this.chickpea_name = category.name;
        this.chickpea_color = category.color;
        this.iconUrl = category.icon_url;
        this.preset = category.preset;
        this.map = map;
        this.map.chickpea_overlays[this.chickpea_id] = this;
        if(typeof options == "undefined") {
            options = {};
        }

        L.LazyGeoJSON.prototype.initialize.call(this, this._dataGetter, options);
        if(this.preset) {
            this.map.addLayer(this);
        }
        this.map.chickpea_layers_control.addOverlay(this, this.chickpea_name);
    },
    _dataUrl: function() {
        var template = this.map.options.urls.feature_geojson_list;
        return L.Util.template(template, {"category_id": this.chickpea_id});
    },
    _dataGetter: function () {
        var geojson;
        L.Util.Xhr.get(this._dataUrl(), {
            "async": false, // To be able to return the geojson
            "callback": function(json) {geojson = json;},
            "dataType": "json"
            });
        return geojson;
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
                layer = this._pointToLayer(geojson, latlng)
                break;
            case 'LineString':
                latlngs = L.GeoJSON.coordsToLatLngs(coords);
                layer = this._lineToLayer(geojson, latlngs);
                break;
            default:
                console.log("Unkown geometry.type: " + geometry.type);
        }
        return this.addLayer(layer);
    },
    _pointToLayer: function(geojson, latlng) {
        if(this.options.pointToLayer) {
            return options.pointToLayer(geojson, latlng);
        }
        return L.chickpea_marker(
            this.map,
            geojson.id,
            latlng,
            {"geojson": geojson, "overlay": this}
        );
    },
    _lineToLayer: function(geojson, latlngs) {
        return new L.ChickpeaPolyline(
            this.map,
            geojson.id,
            latlngs,
            {"geojson": geojson, "overlay": this}
        );
    },

    getEditUrl: function(){
        return L.Util.template(this.map.options.urls.category_update, {'map_id': this.map.options.chickpea_id, 'pk': this.chickpea_id});
    }
});
