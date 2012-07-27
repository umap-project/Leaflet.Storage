L.ChickpeaMarker = L.Marker.extend({

    initialize: function(chickpea_id, latlng, options) {
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
            this.view();
        }
    },

    view: function() {
        var url = L.Util.template(this._map.options.urls.marker, {'pk': this.chickpea_id});
        this._retrievePopupContent(url);
    },

    edit: function() {
        if(!this._map.editEnabled) return;
        var url;
        if(this.chickpea_id) {
            url = L.Util.template(this._map.options.urls.marker_update, {'pk': this.chickpea_id});
        }
        else {
            url = this._map.options.urls.marker_add;
        }
        this._retrievePopupContent(url);
    },

    _retrievePopupContent: function(url) {
        // FIXME: unbind popup when editEnable
        // Otherwise, when we disable editing, popup already openned
        // are not fetched again (and so we keep the edit one)
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
            // Update action in case of creation (do it in python?)
            form.action = self._map.options.urls.marker_add;
            L.Util.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
            L.DomEvent.stop(e);
            return false;
        }
        L.DomEvent.on(form, 'submit', submit);
    }
});

L.chickpea_marker = function (chickpea_id, latlng, options) {
    return new L.ChickpeaMarker(chickpea_id, latlng, options);
};
