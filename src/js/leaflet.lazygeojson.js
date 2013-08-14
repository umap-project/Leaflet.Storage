L.LazyGeoJSON = L.GeoJSON.extend({

    initialize: function (geojson_getter, options) {
        L.Util.setOptions(this, options);

        this._layers = {};
        this.geojson_getter = geojson_getter;
        this._geojson = null;

    },

    onAdd: function (map, insertAtTheBottom) {
        // Fetch geojson only at first call
        if(this._geojson === null) {
            this.fetchData();
        }

        // Call parent of GeoJSON
        L.FeatureGroup.prototype.onAdd.call(this, map, insertAtTheBottom);
    },

    fetchData: function () {
        var self = this;
        this.geojson_getter(function (geojson) {
            self.fromGeoJSON(geojson);
        });
    },

    fromGeoJSON: function (geojson) {
        this.addData(geojson);
        this._geojson = geojson;
        this.fire('dataloaded');
    },

    whenLoaded: function (callback, context) {
        if (this._geojson !== null) {
            callback.call(context || this, this);
        } else {
            this.on('dataloaded', callback, context);
        }
        return this;
    }
});
