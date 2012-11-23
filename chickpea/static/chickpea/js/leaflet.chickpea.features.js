L.Mixin.ChickpeaFeature = {
  _onClick: function(e){
        if(this.map.editEnabled) {
            this.edit(e);
        }
        else {
            if(!this._popup) {
                this.view(e);
            }
        }
    },

    view: function(e) {
        var url = this.getViewURL();
        this._retrievePopupContent(url);
    },

    edit: function() {
        if(!this.map.editEnabled) return;
        var url = this.getEditURL();
        this._retrievePopupContent(url);
    },

    _retrievePopupContent: function(url) {
        // FIXME: unbind popup when editEnable
        // Otherwise, when we disable editing, popup already openned
        // are not fetched again (and so we keep the edit one)
        (function(self){L.Util.Xhr.get(url, {"dataType": "json", "callback": function(data){self._firePopup(data.html);}});})(this);
    },

    _firePopup: function(content) {
        this.bindPopup(content);
        this.openPopup();
        if(this.map.editEnabled) {
            // We are in edit mode, so we display a form
            this.listenEditForm(this.form_id);
        }
    },

    connectToOverlay: function (overlay) {
        var id = L.Util.stamp(this); // Id leaflet, not chickpea
                                     // as new marker will be added too
        this.chickpea_overlay = overlay;
        this.map.marker_to_overlay[id] = overlay;
    },

    disconnectFromOverlay: function (overlay) {
        var id = L.Util.stamp(this); // Id leaflet, not chickpea
                                      // as new marker will be added too
        this.chickpea_overlay = null;
        delete this.map.marker_to_overlay[id];
    },

    listenEditForm: function(form_id) {
        var self = this;
        var form = L.DomUtil.get(form_id);
        var manage_ajax_return = function (data) {
            if(data.html) {
                // We have HTML, put it in the popup
                self._firePopup(data.html);
            }
            else {
                // Guess its a geojson here
                // Update object, if it's new
                var feature = data.features[0];
                if (!self.chickpea_id) {
                    self.chickpea_id = feature.id;
                }
                // Redraw icon in case overlay has changed
                var newOverlay = self.map.chickpea_overlays[feature.properties.category_id];
                if(self.chickpea_overlay !== newOverlay) {
                    self.changeOverlay(newOverlay);
                }
                // FIXME make a little message system
                self.closePopup();
            }
        };
        var submit = function (e) {
            // Always update field value with current position
            // We use JSON, GEOSGeometry is aware of it
            form.latlng.value = JSON.stringify(self.geometry());
            // Update action in case of creation (do it in python?)
            form.action = self.getEditURL();
            L.Util.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
            L.DomEvent.stop(e);
            return false;
        };
        L.DomEvent.on(form, 'submit', submit);
    },

    changeOverlay: function(layer) {
        if(this.chickpea_overlay) {
            this.chickpea_overlay.removeLayer(this);
        }
        layer.addLayer(this);
    },

    getViewURL: function () {
        return L.Util.template(this.view_url_template, {'pk': this.chickpea_id});
    },

    getEditURL: function() {
        return this.chickpea_id?
            L.Util.template(this.update_url_template, {'pk': this.chickpea_id, 'map_id': this.map.options.chickpea_id}):
            L.Util.template(this.add_url_template, {'map_id': this.map.options.chickpea_id});
    }

};

L.ChickpeaMarker = L.Marker.extend({
    includes: [L.Mixin.ChickpeaFeature, L.Mixin.Events],

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

        // URL templates
        this.view_url_template = this.map.options.urls.marker;
        this.update_url_template = this.map.options.urls.marker_update;
        this.add_url_template = this.map.options.urls.marker_add;

        // Events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("mouseover", this._enableDragging);
        this.on("mouseout", this._disableDragging);
    },

    _enableDragging: function() {
        // TODO: start dragging after 1 second on mouse down
        if(this.map.editEnabled) {
            this.dragging.enable();
        }
    },

    _disableDragging: function() {
        if(this.map.editEnabled) {
            this.dragging.disable();
        }
    },

    _redrawIcon: function() {
        this._removeIcon();
        this._initIcon();
        this.update();
    },

    changeOverlay: function(layer) {
        L.Mixin.ChickpeaFeature.changeOverlay.call(this, layer);
        // Icon look depends on overlay
        this._redrawIcon();
    },

    connectToOverlay: function (overlay) {
        this.options.icon.overlay = overlay;
        L.Mixin.ChickpeaFeature.connectToOverlay.call(this, overlay);
    },

    disconnectFromOverlay: function (overlay) {
        this.options.icon.overlay = null;
        L.Mixin.ChickpeaFeature.disconnectFromOverlay.call(this, overlay);
    },

    geometry: function() {
        /* Return a GeoJSON geometry Object */
        var latlng = this.getLatLng();
        return {
            type: "Point",
            coordinates: [
                latlng.lng,
                latlng.lat
            ]
        };
    }
});


L.chickpea_marker = function (map, chickpea_id, latlng, options) {
    return new L.ChickpeaMarker(map, chickpea_id, latlng, options);
};

L.ChickpeaPolyline = L.Polyline.extend({
    includes: [L.Mixin.ChickpeaFeature, L.Mixin.Events],

    initialize: function(map, chickpea_id, latlngs, options) {
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
        L.Polyline.prototype.initialize.call(this, latlngs, options);
        this.form_id = "polyline_form";

        // Use a null chickpea_id when you want to create a new Marker
        this.chickpea_id = chickpea_id;


        // URL templates
        this.view_url_template = this.map.options.urls.polyline;
        this.update_url_template = this.map.options.urls.polyline_update;
        this.add_url_template = this.map.options.urls.polyline_add;

        // Add events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("dblclick", this._toggleEditing);
    },

  _onClick: function(e){
        this._popupHandlersAdded = true;  // Prevent leaflet from managing event
        if(!this.map.editEnabled) {
            this.view(e);
        }
    },

    _toggleEditing: function(e) {
        if(this.map.editEnabled) {
            if(this.editing._enabled) {
                this.editing.disable();
                this.edit();
            }
            else {
                this.editing.enable();
            }
        }
        // FIXME: disable when disabling global edit
        L.DomEvent.stop(e.originalEvent);
    },

    closePopup: function() {
        this._map.closePopup(this._popup);
    },

    _setColor: function () {
        if(this.chickpea_overlay) {
            this.options.color = this.chickpea_overlay.chickpea_color;
        }
    },

    _updateStyle: function () {
        this._setColor();
        L.Polyline.prototype._updateStyle.call(this);
    },

    geometry: function() {
        /* Return a GeoJSON geometry Object */
        var latlngs = this.getLatLngs(), coords = [];
        for(var i = 0, len = latlngs.length; i < len; i++) {
            coords.push([
                latlngs[i].lng,
                latlngs[i].lat
            ]);
        }
        return {
            type: "LineString",
            coordinates: coords
        };
    },

    changeOverlay: function(layer) {
        L.Mixin.ChickpeaFeature.changeOverlay.call(this, layer);
        // path color depends on overlay
        this._updateStyle();
    }
});