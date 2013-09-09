L.Storage.FeatureMixin = {

    form_id: "feature_form",
    static_options: {},

    view: function(e) {
        this.populatePopup();
        this.openPopup(e.latlng);
    },

    edit: function(e) {
        if(!this.map.editEnabled) return;
        this.map.edited_feature = this;
        var self = this,
            container = L.DomUtil.create('div'),
            form = L.DomUtil.create('form', '', container),
            select = L.DomUtil.create('select', '', form),
            option,
            datalayer_id = L.stamp(this.datalayer);
        this.map.eachDataLayer(function (datalayer) {
            var id = L.stamp(datalayer);
            option = L.DomUtil.create('option', '', select);
            option.value = id;
            option.innerHTML = datalayer.options.name;
            if (id === datalayer_id) {
                option.selected = "selected";
            }
        });
        L.DomEvent.on(select, 'change', function (e) {
            var id = select[select.selectedIndex].value,
                datalayer = this.map.datalayers[id];
            this.changeDataLayer(datalayer);
        }, this);
        var properties = [];
        for (var i in this.properties) {
            if (i === "_storage_options") {continue;}
            properties.push('properties.' + i);
        }
        if (!properties.length) {
            properties = ['properties.name', 'properties.description'];
        }
        var builder = new L.S.FormBuilder(this, properties);
        form = builder.build();
        container.appendChild(form);
        var options_fields = this.getStyleOptions();
        builder = new L.S.FormBuilder(this, options_fields, {
            callback: this._redraw,
            callbackContext: this
        });
        form = builder.build();
        container.appendChild(form);
        var deleteLink = L.DomUtil.create('a', 'delete-feature-button', container);
        deleteLink.href = "#";
        deleteLink.innerHTML = L._('Delete');
        L.DomEvent.on(deleteLink, "click", function (e) {
            if (confirm(L._('Are you sure you want to delete the feature?'))) {
                this._delete();
            }
        }, this);
        L.S.fire('ui:start', {data: {html: container}});
        this.bringToCenter();
    },

    populatePopup: function () {
        var container = L.DomUtil.create('div', ''),
            title = L.DomUtil.create('h4', '', container),
            content = L.DomUtil.create('div', '', container);
        // TODO manage popup template, and handle other properties
        title.innerHTML = this.properties.name;
        content.innerHTML = this.properties.description;
        if (this.map.options.displayPopupFooter && !L.Browser.ielt9) {
            var footer = L.DomUtil.create('ul', 'storage-popup-footer', container),
                previous_li = L.DomUtil.create('li', 'previous', footer),
                zoom_li = L.DomUtil.create('li', 'zoom', footer),
                next_li = L.DomUtil.create('li', 'next', footer),
                next = this.getNext(),
                prev = this.getPrevious();
            if (next) {
                next_li.title = L._("Go to «{feature}»", {feature: next.name});
            }
            if (prev) {
                previous_li.title = L._("Go to «{feature}»", {feature: prev.name});
            }
            zoom_li.title = L._("Zoom to this feature");
            L.DomEvent.on(next_li, 'click', function (e) {
                if (next) {
                    next.bringToCenter();
                    next.view(next.getCenter());
                }
            }, this);
            L.DomEvent.on(previous_li, 'click', function (e) {
                if (prev) {
                    prev.bringToCenter();
                    prev.view(prev.getCenter());
                }
            }, this);
            L.DomEvent.on(zoom_li, 'click', function (e) {
                this.map.setZoom(16);
                this.bringToCenter();
            }, this);
        }
        this.bindPopup(container);
    },

    endEdit: function () {
        // if (!this.storage_id) {
        //     this._delete();
        // }
    },

    _delete: function () {
        this.isDirty = true;
        this.map.closePopup();
        if (this.datalayer) {
            this.datalayer.removeLayer(this);
            this.disconnectFromDataLayer(this.datalayer);
        }
        this.map.removeLayer(this);
    },

    connectToDataLayer: function (datalayer) {
        this.datalayer = datalayer;
    },

    disconnectFromDataLayer: function (datalayer) {
        if (this.datalayer === datalayer) {
            this.datalayer = null;
        }
    },

    populate: function (feature) {
        this.properties = L.extend({}, feature.properties);
        this.properties._storage_options = L.extend({}, this.properties._storage_options);
    },

    changeDataLayer: function(datalayer) {
        if(this.datalayer) {
            this.datalayer.isDirty = true;
            this.datalayer.removeLayer(this);
        }
        datalayer.addLayer(this);
        datalayer.isDirty = true;
    },

    usableOption: function (options, option) {
        return typeof options[option] !== "undefined" && options[option] !== "" && options[option] !== null;
    },

    getOption: function (option) {
        var value = null;
        if (this.usableOption(this.properties._storage_options, option)) {
            value = this.properties._storage_options[option];
        }
        else if (typeof this.static_options[option] !== "undefined") {
            value = this.static_options[option];
        }
        else if (this.datalayer && this.usableOption(this.datalayer.options, option)) {
            value = this.datalayer.options[option];
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
    },

    getNext: function () {
        return this.datalayer.getNextFeature(this);
    },

    getPrevious: function () {
        return this.datalayer.getPreviousFeature(this);
    },

    toGeoJSON: function () {
        return {
            type: "Feature",
            geometry: this.geometry(),
            properties: this.properties
        };
    },

    initialize: function () {
        var isDirty = false,
            self = this,
            options = L.extend({}, this.options);
        try {
            Object.defineProperty(this, 'isDirty', {
                get: function () {
                    return isDirty;
                },
                set: function (status) {
                    if (!isDirty && status) {
                        self.fire('isdirty');
                    }
                    isDirty = status;
                    if (self.datalayer) {
                        self.datalayer.isDirty = status;
                    }
                }
            });
        }
        catch (e) {
            console.log(e);
            // Certainly IE8, which has a limited version of defineProperty
        }
    }

};

L.Storage.Marker = L.Marker.extend({
    includes: [L.Storage.FeatureMixin, L.Mixin.Events],

    initialize: function(map, latlng, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // DataLayer the marker belongs to
        this.datalayer = options.datalayer || null;
        this.properties = {_storage_options: {}};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        this.setIcon(this.getIcon());
        L.Marker.prototype.initialize.call(this, latlng, options);
        L.Storage.FeatureMixin.initialize.call(this);

        // URL templates
        this.view_url_template = this.map.options.urls.marker;
        this.update_url_template = this.map.options.urls.marker_update;
        this.add_url_template = this.map.options.urls.marker_add;
        this.delete_url_template = this.map.options.urls.marker_delete;

        // Events
        this.on("dragend", function (e) {
            this.isDirty = true;
            this.edit(e);
        }, this);
        this.on("click", this._onClick);
        this.on("mouseover", this._enableDragging);
        this.on("mouseout", this._onMouseOut);
    },

    populate: function (feature) {
        L.Storage.FeatureMixin.populate.call(this, feature);
        if (feature.properties._storage_options && feature.properties._storage_options.icon) {
            this.options.iconClass = feature.properties._storage_options.icon['class'];
            this.options.iconUrl = feature.properties._storage_options.icon.url;
        }
        this.options.title = feature.properties.name;
    },

    _onClick: function(e){
        this._popupHandlersAdded = true; // prevent Leaflet from binding event on bindPopup
        if(this.map.editEnabled) {
            this.edit(e);
        }
        else {
            this.view(e);
        }
    },

    _onMouseOut: function (e) {
        if(this.dragging && this.dragging._draggable && !this.dragging._draggable._moving) {
            // Do not disable if the mouse went out while dragging
            this._disableDragging();
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
        if (this.datalayer && this.map.hasLayer(this.datalayer)) {
            this._initIcon();
            this.update();
        }
    },

    _initIcon: function () {
        this.options.icon = this.getIcon();
        L.Marker.prototype._initIcon.call(this);
    },

    changeDataLayer: function(layer) {
        L.Storage.FeatureMixin.changeDataLayer.call(this, layer);
        // Icon look depends on datalayer
        this._redraw();
    },

    connectToDataLayer: function (datalayer) {
        // this.options.icon = this.getIcon();
        L.Storage.FeatureMixin.connectToDataLayer.call(this, datalayer);
    },

    disconnectFromDataLayer: function (datalayer) {
        this.options.icon.datalayer = null;
        L.Storage.FeatureMixin.disconnectFromDataLayer.call(this, datalayer);
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
        if (this.properties._storage_options[name + 'Url']) {
            url = this.properties._storage_options[name + 'Url'];
        }
        else if(this.datalayer && this.datalayer.options[name + 'Url']) {
            url = this.datalayer.options[name + 'Url'];
        }
        return url;
    },

    getIconClass: function () {
        var iconClass = this.map.getDefaultOption('iconClass');
        if (this.properties._storage_options.iconClass) {
            iconClass = this.properties._storage_options.iconClass;
        }
        else if (this.datalayer) {
            iconClass = this.datalayer.getIconClass();
        }
        return iconClass;
    },

    getIcon: function () {
        var Class = L.Storage.Icon[this.getIconClass()] || L.Storage.Icon.Default;
        return new Class(this.map, {feature: this});
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

    getClassName: function () {
        return 'marker';
    },

    getStyleOptions: function () {
        return [
            ['properties._storage_options.color', 'ColorPicker'],
            ['properties._storage_options.iconClass', 'IconClassSwitcher'],
            ['properties._storage_options.iconUrl', 'IconUrl']
        ];
    }

});


L.storage_marker = function (map, latlng, options) {
    return new L.Storage.Marker(map, latlng, options);
};

L.Storage.PathMixin = {

    options: {
        clickable: true,
        magnetize: true,
        magnetPoint: null
    },  // reset path options

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

    styleOptions: [
        'smoothFactor',
        'color',
        'opacity',
        'stroke',
        'weight',
        'fill',
        'fillColor',
        'fillOpacity',
        'dashArray'
    ],

    _setStyleOptions: function () {
        var option;
        for (var idx in this.styleOptions) {
            option = this.styleOptions[idx];
            this.options[option] = this.getOption(option);
        }
    },

    getStyleOptions: function () {
        return [
            'properties._storage_options.smoothFactor',
            ['properties._storage_options.color', 'ColorPicker'],
            'properties._storage_options.opacity',
            ['properties._storage_options.stroke', 'NullableBoolean'],
            'properties._storage_options.weight',
            ['properties._storage_options.fill', 'NullableBoolean'],
            ['properties._storage_options.fillColor', 'ColorPicker'],
            'properties._storage_options.fillOpacity',
            'properties._storage_options.dashArray'
        ];
    },

    _updateStyle: function () {
        this._setStyleOptions();
        L.Polyline.prototype._updateStyle.call(this);
    },

    changeDataLayer: function(layer) {
        L.Storage.FeatureMixin.changeDataLayer.call(this, layer);
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
            L.Storage.fire('ui:tooltip', {content: L._("Double-click to edit")});
        }
    }

};

L.Storage.Polyline = L.Polyline.extend({
    includes: [L.Storage.FeatureMixin, L.Storage.PathMixin, L.Mixin.Events],

    static_options: {
        stroke: true,
        fill: false
    },

    initialize: function(map, latlngs, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // DataLayer the marker belongs to
        this.datalayer = options.datalayer || null;
        this.properties = {_storage_options: {}};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        L.Polyline.prototype.initialize.call(this, latlngs, options);
        L.Storage.FeatureMixin.initialize.call(this);

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
    },

    getClassName: function () {
        return 'polyline';
    }

});

L.Storage.Polygon = L.Polygon.extend({
    includes: [L.Storage.FeatureMixin, L.Storage.PathMixin, L.Mixin.Events],

    initialize: function(map, latlngs, options) {
        this.map = map;
        if(typeof options == "undefined") {
            options = {};
        }
        // DataLayer the marker belongs to
        this.datalayer = options.datalayer || null;
        this.properties = {_storage_options: {}};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        L.Polygon.prototype.initialize.call(this, latlngs, options);
        L.Storage.FeatureMixin.initialize.call(this);

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
    },

    getClassName: function () {
        return 'polygon';
    }

});
