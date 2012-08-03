L.ChickpeaMarker = L.Marker.extend({

    initialize: function(map, chickpea_id, latlng, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // Overlay the marker belongs to
        if(options.overlay) {
            this.chickpea_overlay = options.overlay;
        }
        else {
            this.chickpea_overlay = null;
        }
        if(!options.icon) {
            options.icon = new L.ChickpeaIcon(this.map);
        }
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.form_id = "marker_form";
        // Use a null chickpea_id when you want to create a new Marker
        this.chickpea_id = chickpea_id;
        // Add events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("mouseover", this._enableDragging);
        this.on("mouseout", this._disableDragging);
    },

    _onClick: function(){
        if(this._map.editEnabled) {
            this.edit();
        }
        else {
            if(!this._popup) {
                this.view();
            }
        }
    },

    view: function() {
        var url = L.Util.template(this._map.options.urls.marker, {'pk': this.chickpea_id});
        this._retrievePopupContent(url);
    },

    edit: function() {
        if(!this._map.editEnabled) return;
        var url = this.getEditURl();
        this._retrievePopupContent(url);
    },

    getEditURl: function() {
        return this.chickpea_id?
            L.Util.template(this._map.options.urls.marker_update, {'pk': this.chickpea_id}):
            this._map.options.urls.marker_add;     
    },

    _retrievePopupContent: function(url) {
        // FIXME: unbind popup when editEnable
        // Otherwise, when we disable editing, popup already openned
        // are not fetched again (and so we keep the edit one)
        (function(self){L.Util.Xhr.get(url, {"dataType": "json", "callback": function(data){self._firePopup(data.html);}});})(this)
    },

    _firePopup: function(content) {
        this.bindPopup(content);
        this.openPopup();
        if(this._map.editEnabled) {
            // We are in edit mode, so we display a form
            this.listenForm(this.form_id);
        }
    },

    _enableDragging: function() {
        // TODO: start dragging after 1 second on mouse down
        if(this._map.editEnabled) {
            this.dragging.enable();
        }
    },

    _disableDragging: function() {
        if(this._map.editEnabled) {
            this.dragging.disable();
        }        
    },

    _redrawIcon: function() {
        this._removeIcon();
        this._initIcon();
        this.update();
    },

    changeOverlay: function(layer) {
        if(this.chickpea_overlay) {
            this.chickpea_overlay.removeLayer(this);
        }
        layer.addLayer(this);
        this._redrawIcon();
    },

    listenForm: function(form_id) {
        var self = this;
        var form = L.DomUtil.get(form_id);
        var manage_ajax_return = function (data) {
            if(data.html) {
                // We have HTML, put it in the popup
                self._firePopup(data)
            }
            else {
                // Guess its a geojson here
                // Update object, if it's new
                var feature = data.features[0]
                if (!self.chickpea_id) {
                    self.chickpea_id = feature.id;
                }
                // Redraw icon in case overlay has changed
                var newOverlay = self.map.chickpea_overlays[feature.properties.category_id];
                if(self.chickpea_overlay !== newOverlay) {
                    self.changeOverlay(newOverlay);
                }
                console.log("ok") // FIXME make a little message system
                self.closePopup();
            }
        }
        var submit = function (e) {
            // Always update field value with current position
            // We use JSON, GEOSGeometry is aware of it
            form.latlng.value = JSON.stringify(self.geometry());
            // Update action in case of creation (do it in python?)
            form.action = self.getEditURl();
            L.Util.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
            L.DomEvent.stop(e);
            return false;
        }
        L.DomEvent.on(form, 'submit', submit);
    }
});

L.chickpea_marker = function (map, chickpea_id, latlng, options) {
    return new L.ChickpeaMarker(map, chickpea_id, latlng, options);
};
