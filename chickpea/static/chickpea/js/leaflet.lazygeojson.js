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
            var geojson = this.geojson_getter();
            this.addData(geojson);
            this._geojson = geojson;
        }

        // Call parent
        L.FeatureGroup.prototype.onAdd.call(this, map, insertAtTheBottom);
    }
});
