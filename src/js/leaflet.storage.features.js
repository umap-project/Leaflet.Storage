L.Storage.FeatureMixin = {

    form_id: "feature_form",
    static_options: {},

    isReadOnly: function () {
        return this.datalayer && this.datalayer.isRemoteLayer();
    },

    view: function(e) {
        if (this.properties._storage_options.outlink) {
            var win = window.open(this.properties._storage_options.outlink);
            return;
        }
        this.populatePopup();
        this.openPopup(e.latlng);
    },

    edit: function(e) {
        if(!this.map.editEnabled || this.isReadOnly()) return;
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
            if (["_storage_options", "name", "description"].indexOf(i) !== -1) {continue;}
            properties.push(['properties.' + i, {label: i}]);
        }
        // We always want name and description for now (properties management to come)
        properties.unshift('properties.description');
        properties.unshift('properties.name');
        var builder = new L.S.FormBuilder(this, properties);
        form = builder.build();
        container.appendChild(form);
        var options_fields = this.getAdvancedOptions();
        builder = new L.S.FormBuilder(this, options_fields, {
            callback: this._redraw,
            callbackContext: this
        });
        var advancedProperties = L.DomUtil.create('fieldset', 'toggle', container);
        var advancedPropertiesTitle = L.DomUtil.create('legend', 'style_options_toggle', advancedProperties);
        advancedPropertiesTitle.innerHTML = L._('Advanced properties');
        form = builder.build();
        advancedProperties.appendChild(form);
        var advancedActions = L.DomUtil.create('fieldset', 'toggle', container);
        var advancedActionsTitle = L.DomUtil.create('legend', 'style_options_toggle', advancedActions);
        advancedActionsTitle.innerHTML = L._('Advanced actions');
        var deleteLink = L.DomUtil.create('a', 'storage-delete', advancedActions);
        deleteLink.href = "#";
        deleteLink.innerHTML = L._('Delete');
        L.DomEvent.on(deleteLink, "click", function (e) {
            if (this.confirmDelete()) {
                L.S.fire('ui:end');
            }
        }, this);
        L.S.fire('ui:start', {data: {html: container}});
        this.bringToCenter();
    },

    endEdit: function () {},

    defaultPopupTemplate: function (container) {
        var content = L.DomUtil.create('p', '', container);
        if (this.properties.description) {
            content.innerHTML = L.Util.toHTML(this.properties.description);
        }

    },

    tablePopupTemplate: function (container) {
        var table = L.DomUtil.create('table', '', container);

        var addRow = function (key, value) {
            var tr = L.DomUtil.create('tr', '', table);
            L.DomUtil.add('th', '', tr, key);
            L.DomUtil.add('td', '', tr, value);
        };

        for (var key in this.properties) {
            if (typeof this.properties[key] === "object") {
                continue;
            }
            // TODO, manage links (url, mailto, wikipedia...)
            addRow(key, this.properties[key]);
        }
    },

    displayPopupFooter: function () {
        if (L.Browser.ielt9) {
            return false;
        }
        if (this.datalayer.isRemoteLayer() && this.datalayer.options.remoteData.dynamic) {
            return false;
        }
        return this.map.options.displayPopupFooter;
    },

    populatePopup: function () {
        var container = L.DomUtil.create('div', ''),
            template = this.getOption('popupTemplate');
        if (this.properties.name) {
            L.DomUtil.add('h4', '', container, this.properties.name);
        }
        if (template === "table") {
            this.tablePopupTemplate(container);
        } else {
            this.defaultPopupTemplate(container);
        }
        if (this.displayPopupFooter()) {
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

    confirmDelete: function () {
        if (confirm(L._('Are you sure you want to delete the feature?'))) {
            this.del();
            return true;
        }
        return false;
    },

    del: function () {
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
        this.options.title = feature.properties.name;
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

    getOption: function (option, fallback) {
        var value = fallback || null;
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
            properties: L.extend({}, this.properties)
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
        this.on('contextmenu', this._showContextMenu, this);
    },

    _showContextMenu: function (e) {
        var pt = this._map.mouseEventToContainerPoint(e.originalEvent);
        this._map.contextmenu.showAt(pt, {relatedTarget: this});
    },

    makeDirty: function () {
        this.isDirty = true;
    },

    getMap: function () {
        return this._map;
    },

    getContextMenuItems: function () {
        var items = [];
        if (this._map.editEnabled && !this.isReadOnly()) {
            items.push('-',
                {
                    text: L._('Edit this feature'),
                    callback: this.edit,
                    context: this
                },
                {
                    text: L._("Edit feature's layer"),
                    callback: this.datalayer.edit,
                    context: this.datalayer
                },
                {
                    text: L._('Delete this feature'),
                    callback: this.confirmDelete,
                    context: this
                }
            );
        }
        return items;
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

        // Events
        this.on("dragend", function (e) {
            this.isDirty = true;
            this.edit(e);
        }, this);
        this.on("click", this._onClick);
        this.on("mouseover", this._enableDragging);
        this.on("mouseout", this._onMouseOut);
        this._popupHandlersAdded = true; // prevent Leaflet from binding event on bindPopup
    },

    _onClick: function(e){
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
        if (this.datalayer && this.datalayer.isVisible()) {
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

    getAdvancedOptions: function () {
        return [
            'properties._storage_options.color',
            'properties._storage_options.iconClass',
            'properties._storage_options.iconUrl',
            'properties._storage_options.popupTemplate'
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

    getAdvancedOptions: function () {
        return [
            'properties._storage_options.color',
            'properties._storage_options.opacity',
            'properties._storage_options.stroke',
            'properties._storage_options.weight',
            'properties._storage_options.fill',
            'properties._storage_options.fillColor',
            'properties._storage_options.fillOpacity',
            'properties._storage_options.smoothFactor',
            'properties._storage_options.dashArray',
            'properties._storage_options.popupTemplate'
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
    },

    initialize: function () {
        this.on("dragend", this.edit);
        this.on("click", this._onClick);
        this.on("dblclick", this._toggleEditing);
        this.on("mouseover", this._onMouseOver);
        this.on("edit", this.makeDirty);
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
        L.Storage.PathMixin.initialize.call(this);
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
        L.Storage.PathMixin.initialize.call(this);
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
    },

    getAdvancedOptions: function () {
        var options = L.Storage.PathMixin.getAdvancedOptions();
        options.push(['properties._storage_options.outlink', {label: L._('outlink'), helpText: L._("Define output link to open a new window on polygon click.")}]);
        return options;
    }

});
