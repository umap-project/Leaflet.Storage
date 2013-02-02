L.Storage.FeatureMixin = {

    form_id: "feature_form",
    static_options: {},

    view: function(e) {
        var url = this.getViewURL();
        var self = this;
        L.Storage.Xhr.get(url, {
            "callback": function(data){
                self.bindPopup(data.html);
                self.openPopup(e.latlng);
            }
        });
    },

    edit: function(e) {
        if(!this.map.editEnabled) return;
        this.map.edited_feature = this;
        var url = this.getEditURL();
        var self = this;
        L.Storage.Xhr.get(url, {
            "callback": function(data){
                self.bringToCenter(e);
                L.Storage.fire('ui:start', {'data': data});
                self.listenEditForm();
            }
        });
    },

    endEdit: function () {
        if (!this.storage_id) {
            this._delete();
        }
    },

    confirmDelete: function() {
        if(!this.map.editEnabled) return;
        var url = this.getDeleteURL();
        var self = this;
        L.Storage.Xhr.get(url, {
            "callback": function(data){
                L.Storage.fire('ui:start', {'data': data, cssClass: 'warning'});
                self.listenDeleteForm();
            }
        });
    },

    _delete: function () {
        this.map.closePopup();
        if (this.storage_overlay) {
            this.storage_overlay.removeLayer(this);
            this.disconnectFromOverlay(this.storage_overlay);
        }
        this.map.removeLayer(this);
    },

    connectToOverlay: function (overlay) {
        var id = L.Util.stamp(this); // Id leaflet, not storage
                                     // as new marker will be added too
        this.storage_overlay = overlay;
        this.map.marker_to_overlay[id] = overlay; // TODO rename
    },

    disconnectFromOverlay: function (overlay) {
        var id = L.Util.stamp(this); // Id leaflet, not storage
                                      // as new marker will be added too
        this.storage_overlay = null;
        delete this.map.marker_to_overlay[id];
    },

    listenEditForm: function() {
        var self = this;
        var form = L.DomUtil.get(this.form_id);
        var colorHelper = new L.Storage.FormHelper.Color(this.map, this.form_id, {
            color: this.getOption('color')
        });
        var manage_ajax_return = function (data) {
            if(data.html) {
                // We have HTML, put it in the popup
                L.Storage.fire('ui:start', {'data': data});
                self.listenEditForm();
            }
            else {
                // Guess its a geojson here
                // Update object, if it's new
                self.updateFromBackEnd(data);
                L.Storage.fire('ui:end');
                L.Storage.fire("ui:alert", {"content": L.S._("Feature updated with success!"), "level": "info"});
            }
        };
        var submit = function (e) {
            L.DomEvent.off(form, 'submit', submit);
            // Always update field value with current position
            // We use JSON, GEOSGeometry is aware of it
            form.latlng.value = JSON.stringify(self.geometry());
            // Update action in case of creation (do it in python?)
            form.action = self.getEditURL();
            L.Storage.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
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
                L.Storage.fire('ui:alert', {'content': data.error, 'level': 'error'});
            }
            else if (data.info) {
                self._delete();
                L.Storage.fire('ui:alert', {'content': data.info, 'level': 'info'});
                L.Storage.fire('ui:end');
            }
        };
        var submit = function (e) {
            form.action = self.getDeleteURL();
            L.Storage.Xhr.submit_form(form, {"callback": function(data) { manage_ajax_return(data);}});
        };
        L.DomEvent.on(form, 'submit', submit);
    },

    populate: function (feature) {
        if (!this.storage_id) {
            this.storage_id = feature.id;
        }
        this.storage_options = feature.properties.options;
    },

    updateFromBackEnd: function (feature) {
        this.populate(feature);
        var newOverlay = this.map.storage_overlays[feature.properties.category_id];
        if(this.storage_overlay !== newOverlay) {
            this.changeOverlay(newOverlay);
        } else {
            // Needed only if overlay hasn't changed because
            // changeOverlay method already make the style to be
            // updated
            this._redraw();
        }
        // Force refetch of the popup content
        this._popup = null;
    },

    changeOverlay: function(layer) {
        if(this.storage_overlay) {
            this.storage_overlay.removeLayer(this);
        }
        layer.addLayer(this);
    },

    getViewURL: function () {
        return L.Util.template(this.view_url_template, {'pk': this.storage_id});
    },

    getEditURL: function() {
        return this.storage_id?
            L.Util.template(this.update_url_template, {'pk': this.storage_id, 'map_id': this.map.options.storage_id}):
            L.Util.template(this.add_url_template, {'map_id': this.map.options.storage_id});
    },

    getDeleteURL: function() {
        return L.Util.template(this.delete_url_template, {'pk': this.storage_id, 'map_id': this.map.options.storage_id});
    },

    usableOption: function (options, option) {
        return typeof options[option] !== "undefined" && options[option] !== "" && options[option] !== null;
    },

    getOption: function (option) {
        var value = null;
        if (typeof this.static_options[option] !== "undefined") {
            value = this.static_options[option];
        }
        else if (this.usableOption(this.storage_options, option)) {
            value = this.storage_options[option];
        }
        else if (this.storage_overlay && this.usableOption(this.storage_overlay.options, option)) {
            value = this.storage_overlay.options[option];
        }
        else {
            value = this.map.getDefaultOption(option);
        }
        return value;
    },

    bringToCenter: function (e) {
        var latlng;
        if (e && e.latlng) {
            latlng = e.latlng;
        }
        else {
            latlng = this.getCenter();
        }
        this.map.panTo(latlng);
    }
};

L.Storage.Marker = L.Marker.extend({
    includes: [L.Storage.FeatureMixin, L.Mixin.Events],

    initialize: function(map, storage_id, latlng, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // Overlay the marker belongs to
        this.storage_overlay = options.overlay || null;
        this.storage_options = {};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        this.setIcon(this.getIcon());
        L.Marker.prototype.initialize.call(this, latlng, options);

        // Use a null storage_id when you want to create a new Marker
        this.storage_id = storage_id;

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

    populate: function (feature) {
        L.Storage.FeatureMixin.populate.call(this, feature);
        this.storage_icon_class = feature.properties.icon['class'];
        this.iconUrl = feature.properties.icon.url;
        this.options.title = feature.properties.name;
    },

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

    _enableDragging: function() {
        // TODO: start dragging after 1 second on mouse down
        if(this.map.editEnabled) {
            this.dragging.enable();
            // Enabling dragging on the marker override the Draggable._OnDown
            // event, which, as it stopPropagation, refrain the call of
            // _onDown with map-pane element, which is responsible to
            // set the _moved to false, and thus to enable the click.
            // We should find a cleaner way to handle this.
            this.map.dragging._draggable._moved = false;
        }
    },

    _disableDragging: function() {
        if(this.map.editEnabled) {
            this.dragging.disable();
        }
    },

    _redraw: function() {
        this.setIcon(this.getIcon());
        this._initIcon();
        this.update();
    },

    changeOverlay: function(layer) {
        L.Storage.FeatureMixin.changeOverlay.call(this, layer);
        // Icon look depends on overlay
        this._redraw();
    },

    connectToOverlay: function (overlay) {
        // this.options.icon = this.getIcon();
        L.Storage.FeatureMixin.connectToOverlay.call(this, overlay);
    },

    disconnectFromOverlay: function (overlay) {
        this.options.icon.overlay = null;
        L.Storage.FeatureMixin.disconnectFromOverlay.call(this, overlay);
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
        if (typeof name === "undefined") {
            name = "icon";
        }
        var url = null;
        if (this[name + 'Url']) {
            url = this[name + 'Url'];
        }
        else if(this.storage_overlay && this.storage_overlay[name + 'Url']) {
            url = this.storage_overlay[name + 'Url'];
        }
        return url;
    },

    getIconClass: function () {
        var iconClass = this.map.getDefaultOption('iconClass');
        if (this.storage_icon_class) {
            iconClass = this.storage_icon_class;
        }
        else if (this.storage_overlay) {
            iconClass = this.storage_overlay.getIconClass();
        }
        return iconClass;
    },

    getIcon: function () {
        return new L.Storage.Icon[this.getIconClass()](this.map, {feature: this});
    },

    getCenter: function () {
        return this._latlng;
    },

    openPopup: function () {
        if (this.map.editEnabled) {
            return;
        }
        L.Marker.prototype.openPopup.call(this);
    },

    listenEditForm: function () {
        var iconHelper = new L.Storage.FormHelper.IconField(this.map, this.form_id, {
            iconUrl: this._getIconUrl() || this.map.getDefaultOption('iconUrl'),
            iconColor: this.getOption('color'),
            iconClass: this.getIconClass()
        });
        L.Storage.FeatureMixin.listenEditForm.call(this);
    }

});


L.storage_marker = function (map, storage_id, latlng, options) {
    return new L.Storage.Marker(map, storage_id, latlng, options);
};

L.Storage.PathMixin = {

    options: {
        clickable: true,
        magnetize: true,
        magnetPoint: null
    },  // reset path options

    storage_options: {},

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
                L.Storage.fire('ui:end');
            }
            else {
                this.editing.enable();
                this.edit(e);
            }
        }
        // FIXME: disable when disabling global edit
        L.DomEvent.stop(e.originalEvent);
    },

    closePopup: function() {
        this.map.closePopup(this._popup);
    },

    _setStyleOptions: function () {
        var option,
            style_options = [
            'smoothFactor',
            'color',
            'opacity',
            'stroke',
            'weight',
            'fill',
            'fillColor',
            'fillOpacity',
            'dashArray'
        ];
        for (var idx in style_options) {
            option = style_options[idx];
            this.options[option] = this.getOption(option);
        }
    },

    _updateStyle: function () {
        this._setStyleOptions();
        L.Polyline.prototype._updateStyle.call(this);
    },

    changeOverlay: function(layer) {
        L.Storage.FeatureMixin.changeOverlay.call(this, layer);
        this._redraw();
    },

    _redraw: function () {
        this._updateStyle();
    },

    getCenter: function () {
        return this._latlng || this._latlngs[Math.floor(this._latlngs.length / 2)];
    },

    endEdit: function () {
        this.editing.disable();
        L.Storage.FeatureMixin.endEdit.call(this);
    },

    _onMouseOver: function (e) {
        if (this.map.editEnabled && !this.editing._enabled) {
            L.Storage.fire('ui:tooltip', {content: L.S._("Double-click to edit")});
        }
    }

};

L.Storage.Polyline = L.Polyline.extend({
    includes: [L.Storage.FeatureMixin, L.Storage.PathMixin, L.Mixin.Events],

    static_options: {
        stroke: true,
        fill: false
    },

    initialize: function(map, storage_id, latlngs, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // Overlay the marker belongs to
        this.storage_overlay = options.overlay || null;
        this.storage_options = {};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        L.Polyline.prototype.initialize.call(this, latlngs, options);

        // Use a null storage_id when you want to create a new Marker
        this.storage_id = storage_id;


        // URL templates
        this.view_url_template = this.map.options.urls.polyline;
        this.update_url_template = this.map.options.urls.polyline_update;
        this.add_url_template = this.map.options.urls.polyline_add;
        this.delete_url_template = this.map.options.urls.polyline_delete;

        // Add events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("dblclick", this._toggleEditing);
        this.on("mouseover", this._onMouseOver);
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

L.Storage.Polygon = L.Polygon.extend({
    includes: [L.Storage.FeatureMixin, L.Storage.PathMixin, L.Mixin.Events],

    initialize: function(map, storage_id, latlngs, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // Overlay the marker belongs to
        this.storage_overlay = options.overlay || null;
        this.storage_options = {};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        L.Polygon.prototype.initialize.call(this, latlngs, options);

        // Use a null storage_id when you want to create a new Marker
        this.storage_id = storage_id;

        // URL templates
        this.view_url_template = this.map.options.urls.polygon;
        this.update_url_template = this.map.options.urls.polygon_update;
        this.add_url_template = this.map.options.urls.polygon_add;
        this.delete_url_template = this.map.options.urls.polygon_delete;

        // Add events
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("dblclick", this._toggleEditing);
        this.on("mouseover", this._onMouseOver);
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
