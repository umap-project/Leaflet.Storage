L.Map.mergeOptions({
    base_layers: null,
    overlay_layers: null,
    categories: [],
    zoom: 10,
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
        this.setView(center, this.options.zoom).addLayer(landscape);
        this.baselayers = {"landscape": landscape};
        // Init control layers
        // It will be populated while creating the overlays
        this.chickpea_layers_control = new L.Control.Layers()
        // this.addLayer(geojsonLayer);
        this.addControl(this.chickpea_layers_control);
        // Global storage for retrieving overlays
        this.chickpea_overlays = {};
        this.marker_to_overlay = {};
        // create overlays
        for(var i in this.options.categories) {
            if(this.options.categories.hasOwnProperty(i)){
                this._createOverlay(this.options.categories[i]);
            }
        }
    },
    _createOverlay: function(category) {
        return new L.ChickpeaLayer(category, this);
    }
});
