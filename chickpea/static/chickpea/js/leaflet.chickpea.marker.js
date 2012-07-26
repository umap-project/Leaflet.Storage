L.ChickpeaMarker = L.Marker.extend({

    initialize: function(latlng, options) {
        L.Marker.prototype.initialize.call(this, latlng, options);
        this.form_id = "marker_form";

        // Add events
        this.on("dragend", this._retrievePopupContent);
        this.on("click", this._retrievePopupContent);
        this.on("mouseover", this._enableDragging);
        this.on("mouseout", this._disableDragging);
    },

    _retrievePopupContent: function() {
        if (this._popup && !this._map.editEnabled) return;
        var template = this._map.editEnabled ? this._map.options.urls.marker_update: this._map.options.urls.marker;
        var url = L.Util.template(template, {'pk': this.options.geojson.id});
        (function(self){L.Util.Xhr.get(url, {"callback": function(data){self._firePopup(data);}});})(this)
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

    listenForm: function(form_id) {
        var self = this;
        var form = L.DomUtil.get(form_id);
        var manage_ajax_return = function (data) {
            if(data === "ok") {
                console.log("ok") // FIXME make a little message system
                self.closePopup();
            }
            else {
                self.firePopup(data)
            }
        }
        var submit = function (e) {
            // Always update field value with current position
            // We use JSON, GEOSGeometry is aware of it
            form.latlng.value = JSON.stringify(self.geometry());
            L.Util.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
            L.DomEvent.stop(e);
            return false;
        }
        L.DomEvent.on(form, 'submit', submit);
    }
});

L.chickpea_marker = function (latlng, options) {
    return new L.ChickpeaMarker(latlng, options);
};
