L.Map.mergeOptions({
    base_layers: null,
    overlay_layers: null,
    categories: [],
    zoom: 10,
    lat: null,
    lng: null
});

L.ChickpeaMap = L.Map.extend({
    initialize: function (/* DOM element or id*/ el, /* Object*/ options) {
        // Call the parent
        L.Map.prototype.initialize.call(this, el, options);
        // User must provide a pk
        if (typeof this.options.chickpea_id == "undefined") {
            alert("ImplementationError: you must provide a chickpea_id for ChickpeaMap.")
        }

        // Hash management (for permalink)
        this.hash = new L.Hash(this);

        if (this.options.allowEdit) {
            // Layer for items added by users
            var drawnItems = new L.LayerGroup();
            this.on('draw:marker-created', function (e) {
                drawnItems.addLayer(e.marker);
                e.marker.edit();
            });
            this.on("popupclose", function(e) {
                // remove source if it has not been created (no chickpea_id)
                var layer = e.popup._source;
                var id = L.Util.stamp(layer);
                if(drawnItems._layers.hasOwnProperty(id)
                    && !layer.chickpea_id) {
                    drawnItems.removeLayer(layer);
                }
            });
            this.addLayer(drawnItems);
        }

        var landscape = new L.TileLayer(
            'http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png',
            {
                attribution: 'test',
                maxZoom: 18
            }
        );
        this.addLayer(landscape);
        if(location.hash) {
            // FIXME An invalid hash will cause the load to fail
            this.hash.update();
        }
        else if(options.locate && options.locate.setView) {
            // Prevent from making two setViews at init
            // which is not very fluid...
            this.locate(options.locate);
        }
        else {
            var center = new L.LatLng(this.options.lat, this.options.lng);
            this.setView(center, this.options.zoom)
        }
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
