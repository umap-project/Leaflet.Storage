L.ChickpeaLayer = L.LazyGeoJSON.extend({
    initialize: function (/* Object from db */ category, map, options) {
        L.LazyGeoJSON.prototype.initialize.call(this, this._dataGetter, options);
        this.chickpea_id = category.pk;
        this.chickpea_name = category.title;
        this.map = map;
        this.map.chickpea_layers_control.addOverlay(this, this.chickpea_name);
    },
    _dataUrl: function() {
        var template = this.map.options.urls.marker_geojson_list;
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
    }
});
