var ChickpeaMap = L.Class.extend({
    initialize: function (/* DOM element or id*/ el, /* Object*/ options) {
        this.options = defaults = {
            base_layers: null,
            overlay_layers: null,
            categories: [],
            zoom: null,
            lat: null,
            lng: null,
        };
        L.Util.setOptions(this, options);

        /* Create map object */
        this.map = new L.Map('map', {"allowEdit": true});
        
        // var drawControl = new L.Control.Draw({
        //     position: 'topleft',
        //     polygon: null,
        //     polyline: null,
        //     rectangle: null,
        //     circle: null
        // });
        // this.map.addControl(drawControl);

        // var drawnItems = new L.LayerGroup();
        // this.map.on('draw:marker-created', function (e) {
        // drawnItems.addLayer(e.marker);
        // });
        // this.map.addLayer(drawnItems);

        var landscape = new L.TileLayer(
            'http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png',
            {
                attribution: 'test',
                maxZoom: 18
            }
        );
        var center = new L.LatLng(this.options.lat, this.options.lng);
        this.map.setView(center, 13).addLayer(landscape);
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
                    {"pointToLayer": function (geojson, latlng) {return self._pointToLayer(geojson, latlng);}}
                );
                control_config_overlays[category.title] = geojsonLayer;
            })(this);
        }
        // this.map.addLayer(geojsonLayer);
        var layersControl = new L.Control.Layers(
            this.baselayers,
            control_config_overlays
        );
        this.map.addControl(layersControl);

    },
    _pointToLayer: function(geojson, latlng) {
        var self = this;
        var marker = new L.Marker(latlng);
        var get_marker_form = function (e) {
            if (marker._popup && !self.map.editEnabled) return; // Maybe we should not, in case
                                       // data has been modified in
                                       // db by another process
            var template = self.map.editEnabled ? self.options.urls.marker_update: self.options.urls.marker;
            var url = L.Util.template(template, {'pk': geojson.id});
            L.Util.Xhr.get(url, {"callback": function(data){self.bindPopup(marker, data);}});
        }
        var update_marker_position = function (e) {
            // Get the lonlat and save it to db
            get_marker_form(e);
            var form = L.DomUtil.get('marker_edit');
        }
        marker.on("dragend", update_marker_position);
        // Only in edit mode
        marker.on("click", get_marker_form);
        var start = function (e) {
            // TODO: start dragging after 1 second on mouse down
            if(self.map.editEnabled) {
                marker.dragging.enable();
            }
            // clearTimeout(marker.downTimer);
            //     marker.downTimer = setTimeout(function() {
            //         marker.dragging.enable();
            //     }, 1000);
        }
        var stop = function (e) {
            //clearTimeout(marker.downTimer);
            if(self.map.editEnabled) {
                marker.dragging.disable();
            }
        }
        marker.on("mouseover", start);
        marker.on("mouseout", stop);
        return marker;
    },
    bindPopup: function(marker, content) {
        marker.bindPopup(content);
        marker.openPopup();
        if(this.map.editEnabled) {
            // We are in edit mode, so we display a form
            this.listenForm("marker_edit", marker);
        }
    },
    listenForm: function(form_id, marker) {
        var self = this;
        var form = L.DomUtil.get(form_id);
        var manage_return = function (data) {
            if(data === "ok") {
                console.log("ok") // FIXME make a little message system
                marker.closePopup();
            }
            else {
                self.bindPopup(marker, data)
            }
        }
        var submit = function (e) {
            // Always update field value with current position
            // We use JSON, GEOSGeometry is aware of it
            form.position.value = JSON.stringify(marker.geometry());
            L.Util.Xhr.submit_form(form, {"callback": function(data) { manage_return(data);}});
            L.DomEvent.stop(e);
            return false;
        }
        L.DomEvent.on(form, 'submit', submit);
    }
});
