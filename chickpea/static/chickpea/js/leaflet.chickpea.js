L.Map.mergeOptions({
    base_layers: null,
    overlay_layers: null,
    categories: [],
    zoom: null,
    lat: null,
    lng: null,
    allowEdit: true
});

L.ChickpeaMap = L.Map.extend({
    initialize: function (/* DOM element or id*/ el, /* Object*/ options) {
        // Call the parent
        L.Map.prototype.initialize.call(this, el, options);
        // User must provide a pk
        if (typeof this.options.chickpea_id == "undefined") {
            alert("ImplementationError: you must provide a chickpea_id for ChickpeaMap.")
        }

        var drawnItems = new L.LayerGroup();
        this.on('draw:marker-created', function (e) {
            drawnItems.addLayer(e.marker);
            e.marker.edit();
        });
        this.addLayer(drawnItems);

        var landscape = new L.TileLayer(
            'http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png',
            {
                attribution: 'test',
                maxZoom: 18
            }
        );
        var center = new L.LatLng(this.options.lat, this.options.lng);
        this.setView(center, 13).addLayer(landscape);
        this.baselayers = {"landscape": landscape};
        this.init_controls();
    },
    init_controls: function () {
        var categories_url_template = this.options.urls.marker_geojson_list;
        var geojson_getter = function (url) {
            var geojson;
            L.Util.Xhr.get(url, {
                "async": false, // To be able to return the geojson
                "callback": function(json) {geojson = json;},
                "dataType": "json"
                });
            return geojson;
        }
        var control_config_overlays = {};
        // Add overlays
        for(var i=0; i<this.options.categories.length; i++) {
            (function(self){ // Anonymous function to prevent from
                             // sharing the scope between loops
                var category = self.options.categories[i];
                var category_url = L.Util.template(categories_url_template, {"category_id": category.pk});
                var getter = function(){return geojson_getter(category_url);};
                var geojsonLayer = new L.LazyGeoJSON(
                    getter, 
                    {"pointToLayer": function (geojson, latlng) {
                            return L.chickpea_marker(geojson.id, latlng, {"geojson": geojson});
                        }}
                );
                control_config_overlays[category.title] = geojsonLayer;
            })(this);
        }
        // this.addLayer(geojsonLayer);
        var layersControl = new L.Control.Layers(
            this.baselayers,
            control_config_overlays
        );
        this.addControl(layersControl);

    },
});
