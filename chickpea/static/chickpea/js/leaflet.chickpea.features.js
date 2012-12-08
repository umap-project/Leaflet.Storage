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
        var self = this;
        L.Util.Xhr.get(url, {
            "callback": function(data){
                self._firePopup(data.html);
            }
        });
    },

    edit: function() {
        if(!this.map.editEnabled) return;
        var url = this.getEditURL();
        var self = this;
        L.Util.Xhr.get(url, {
            "callback": function(data){
                self._firePopup(data.html);
                self.listenEditForm(self.form_id);
            }
        });
    },

    confirmDelete: function() {
        if(!this.map.editEnabled) return;
        var url = this.getDeleteURL();
        var self = this;
        L.Util.Xhr.get(url, {
            "callback": function(data){
                self._firePopup(data.html);
                self.listenDeleteForm();
            }
        });
    },

    _delete: function () {
        this.map.closePopup();
        if (this.chickpea_overlay) {
            this.chickpea_overlay.removeLayer(this);
            this.disconnectFromOverlay(this.chickpea_overlay);
        }
        this.map.removeLayer(this);
    },

    _firePopup: function(content) {
        this.bindPopup(content);
        this.openPopup();
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
                var newColor = feature.properties.color;
                var oldColor = self.chickpea_color;
                self.chickpea_color = newColor;
                var newOverlay = self.map.chickpea_overlays[feature.properties.category_id];
                if(self.chickpea_overlay !== newOverlay) {
                    self.changeOverlay(newOverlay);
                } else {
                    // Needed only if overlay hasn't changed because
                    // changeOverlay method already make the style to be
                    // updated
                    if (oldColor != newColor) {
                        self.resetColor();
                    }

                }
                self.closePopup();
                L.Chickpea.fire("alert", {"content": "Feature updated with success!", "level": "info"});
            }
        };
        var submit = function (e) {
            L.DomEvent.off(form, 'submit', submit);
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
        var delete_link = L.DomUtil.get("delete_feature_button");
        if (delete_link) {
            L.DomEvent
                .on(delete_link, 'click', L.DomEvent.stopPropagation)
                .on(delete_link, 'click', L.DomEvent.preventDefault)
                .on(delete_link, 'click', this.confirmDelete, this);
        }
    },

    listenDeleteForm: function() {
        var form = L.DomUtil.get("feature_delete");
        var self = this;
        var manage_ajax_return = function (data) {
            if (data.error) {
                L.Chickpea.fire('alert', {'content': data.error, 'level': 'error'});
            }
            else if (data.info) {
                self._delete();
                L.Chickpea.fire('alert', {'content': data.info, 'level': 'info'});
            }
        };
        var submit = function (e) {
            form.action = self.getDeleteURL();
            L.Util.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
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
    },

    getDeleteURL: function() {
        return L.Util.template(this.delete_url_template, {'pk': this.chickpea_id, 'map_id': this.map.options.chickpea_id});
    },

    getColor: function () {
        var color;
        if (this.chickpea_color) {
            color = this.chickpea_color;
        }
        else if (this.chickpea_overlay) {
            color = this.chickpea_overlay.getColor();
        }
        else {
            color = this.map.options.default_color;
        }
        return color;
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
        this.chickpea_overlay = options.overlay || null;
        this.chickpea_color = options.geojson ? options.geojson.properties.color : null;
        if(!options.icon) {
            if (this.chickpea_overlay) {
                options.icon = this.chickpea_overlay.getIcon();
            }
            else {
                options.icon = new L.ChickpeaIcon.Default(this.map);
            }
        }
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.form_id = "marker_form";

        // Use a null chickpea_id when you want to create a new Marker
        this.chickpea_id = chickpea_id;

        // URL templates
        this.view_url_template = this.map.options.urls.marker;
        this.update_url_template = this.map.options.urls.marker_update;
        this.add_url_template = this.map.options.urls.marker_add;
        this.delete_url_template = this.map.options.urls.marker_delete;

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

    resetColor: function () {
        this._redrawIcon();
    },

    connectToOverlay: function (overlay) {
        this.options.icon = overlay.getIcon();
        this.options.icon.feature = this;
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
    },

    _getIconUrl: function (name) {
        var url = null;
        // TODO manage picto in the marker itself
        if(this.chickpea_overlay && this.chickpea_overlay[name + 'Url']) {
            url = this.chickpea_overlay[name + 'Url'];
        }
        return url;
    }
});


L.chickpea_marker = function (map, chickpea_id, latlng, options) {
    return new L.ChickpeaMarker(map, chickpea_id, latlng, options);
};

L.Mixin.ChickpeaPath = {

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
        this.map.closePopup(this._popup);
    },

    _setColor: function () {
        this.options.color = this.getColor();
    },

    _updateStyle: function () {
        this._setColor();
        L.Polyline.prototype._updateStyle.call(this);
    },

    changeOverlay: function(layer) {
        L.Mixin.ChickpeaFeature.changeOverlay.call(this, layer);
        // path color depends on overlay
        this._updateStyle();
    },

    resetColor: function () {
        this._updateStyle();
    }
};


L.ChickpeaPolyline = L.Polyline.extend({
    includes: [L.Mixin.ChickpeaFeature, L.Mixin.ChickpeaPath, L.Mixin.Events],

    initialize: function(map, chickpea_id, latlngs, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // Overlay the marker belongs to
        this.chickpea_overlay = options.overlay || null;
        this.chickpea_color = options.geojson ? options.geojson.properties.color : null;
        L.Polyline.prototype.initialize.call(this, latlngs, options);
        this.form_id = "polyline_form";

        // Use a null chickpea_id when you want to create a new Marker
        this.chickpea_id = chickpea_id;


        // URL templates
        this.view_url_template = this.map.options.urls.polyline;
        this.update_url_template = this.map.options.urls.polyline_update;
        this.add_url_template = this.map.options.urls.polyline_add;
        this.delete_url_template = this.map.options.urls.polyline_delete;

        // Add events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("dblclick", this._toggleEditing);
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
    }

});

L.ChickpeaPolygon = L.Polygon.extend({
    includes: [L.Mixin.ChickpeaFeature, L.Mixin.ChickpeaPath, L.Mixin.Events],

    initialize: function(map, chickpea_id, latlngs, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // Overlay the marker belongs to
        this.chickpea_overlay = options.overlay || null;
        this.chickpea_color = options.geojson ? options.geojson.properties.color : null;
        L.Polygon.prototype.initialize.call(this, latlngs, options);
        this.form_id = "polygon_form";

        // Use a null chickpea_id when you want to create a new Marker
        this.chickpea_id = chickpea_id;

        // URL templates
        this.view_url_template = this.map.options.urls.polygon;
        this.update_url_template = this.map.options.urls.polygon_update;
        this.add_url_template = this.map.options.urls.polygon_add;
        this.delete_url_template = this.map.options.urls.polygon_delete;

        // Add events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("dblclick", this._toggleEditing);
    },

    geometry: function() {
        /* Return a GeoJSON geometry Object */
        /* see: https://github.com/CloudMade/Leaflet/issues/1135 */
        /* and: https://github.com/CloudMade/Leaflet/issues/712 */
        var latlngs = this.getLatLngs(), coords = [], closingPoint = latlngs[0];
        latlngs.push(closingPoint);  // Artificially create a LinearRing
        for(var i = 0, len = latlngs.length; i < len; i++) {
            coords.push([
                latlngs[i].lng,
                latlngs[i].lat
            ]);
        }
        return {
            type: "Polygon",
            coordinates: [coords]
        };
    }

});