L.Storage.FeatureMixin = {

    staticOptions: {},

    initialize: function (map, latlng, options) {
        this.map = map;
        if(typeof options === 'undefined') {
            options = {};
        }
        // DataLayer the marker belongs to
        this.datalayer = options.datalayer || null;
        this.properties = {_storage_options: {}};
        if (options.geojson) {
            this.populate(options.geojson);
        }
        var isDirty = false,
            self = this;
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
            // Certainly IE8, which has a limited version of defineProperty
        }
        this.preInit();
        this.addInteractions();
        this.parentClass.prototype.initialize.call(this, latlng, options);
    },

    preInit: function () {},

    isReadOnly: function () {
        return this.datalayer && this.datalayer.isRemoteLayer();
    },

    view: function(latlng) {
        if (this.map.editEnabled) {
            return;
        }
        if (this.properties._storage_options.outlink) {
            var win = window.open(this.properties._storage_options.outlink);
            return;
        }
        if (this.map.slideshow) {
            this.map.slideshow.current = this;
        }
        this.attachPopup();
        this.openPopup(latlng || this.getCenter());
    },

    openPopup: function () {
        if (this.map.editEnabled) {
            return;
        }
        this.parentClass.prototype.openPopup.apply(this, arguments);
    },

    edit: function(e) {
        if(!this.map.editEnabled || this.isReadOnly()) return;
        var container = L.DomUtil.create('div');

        var builder = new L.S.FormBuilder(this, ['datalayer'], {
            callback: function () {this.edit(e);}  // removeLayer step will close the edit panel, let's reopen it
        });
        container.appendChild(builder.build());

        var properties = [], property;
        for (var i = 0; i < this.datalayer._propertiesIndex.length; i++) {
            property = this.datalayer._propertiesIndex[i];
            if (L.Util.indexOf(['name', 'description'], property) !== -1) {continue;}
            properties.push(['properties.' + property, {label: property}]);
        }
        // We always want name and description for now (properties management to come)
        properties.unshift('properties.description');
        properties.unshift('properties.name');
        builder = new L.S.FormBuilder(this, properties,
            {
                id: 'storage-feature-properties',
                callback: this.resetLabel
            }
        );
        container.appendChild(builder.build());
        this.appendEditFieldsets(container);
        var advancedActions = L.DomUtil.createFieldset(container, L._('Advanced actions'));
        this.getAdvancedEditActions(advancedActions);
        L.S.fire('ui:start', {data: {html: container}});
        this.map.editedFeature = this;
        if (!this.isOnScreen()) this.bringToCenter(e);
    },

    getAdvancedEditActions: function (container) {
        var deleteLink = L.DomUtil.create('a', 'storage-delete', container);
        deleteLink.href = '#';
        deleteLink.innerHTML = L._('Delete');
        L.DomEvent.on(deleteLink, 'click', function (e) {
            L.DomEvent.stop(e);
            if (this.confirmDelete()) {
                L.S.fire('ui:end');
            }
        }, this);
    },

    appendEditFieldsets: function (container) {
        var optionsFields = this.getAdvancedOptions();
        var builder = new L.S.FormBuilder(this, optionsFields, {
            id: 'storage-feature-advanced-properties',
            callback: this._redraw,
            callbackContext: this
        });
        var advancedProperties = L.DomUtil.createFieldset(container, L._('Advanced properties'));
        advancedProperties.appendChild(builder.build());

        var popupFields = [
            'properties._storage_options.popupTemplate'
        ];
        builder = new L.S.FormBuilder(this, popupFields);
        var popupFieldset = L.DomUtil.createFieldset(container, L._('Popup options'));
        popupFieldset.appendChild(builder.build());

    },

    endEdit: function () {},

    getDisplayName: function () {
        return this.properties.name || this.properties.title || this.datalayer.options.name;
    },

    hasPopupFooter: function () {
        if (L.Browser.ielt9) {
            return false;
        }
        if (this.datalayer.isRemoteLayer() && this.datalayer.options.remoteData.dynamic) {
            return false;
        }
        return this.map.options.displayPopupFooter;
    },

    getPopupClass: function () {
        return L.Storage.Popup[this.getOption('popupTemplate')] || L.Storage.Popup;
    },

    attachPopup: function () {
        var Class = this.getPopupClass();
        this.bindPopup(new Class(this));
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
        this.options.title = feature.properties && feature.properties.name;
        this.properties._storage_options = L.extend({}, this.properties._storage_options);
        // Retrocompat
        if (this.properties._storage_options.clickable === false) {
            this.properties._storage_options.interactive = false;
            delete this.properties._storage_options.clickable;
        }
    },

    changeDataLayer: function(datalayer) {
        if(this.datalayer) {
            this.datalayer.isDirty = true;
            this.datalayer.removeLayer(this);
        }
        datalayer.addLayer(this);
        datalayer.isDirty = true;
        this._redraw();
    },

    getOption: function (option, fallback) {
        var value = fallback || null;
        if (typeof this.staticOptions[option] !== 'undefined') {
            value = this.staticOptions[option];
        }
        else if (L.Util.usableOption(this.properties._storage_options, option)) {
            value = this.properties._storage_options[option];
        }
        else if (this.datalayer && L.Util.usableOption(this.datalayer.options, option)) {
            value = this.datalayer.options[option];
        }
        else {
            value = this.map.getOption(option);
        }
        return value;
    },

    bringToCenter: function (e, callback) {
        var latlng;
        if (e && e.zoomTo) this.map._zoom = e.zoomTo;
        if (e && e.latlng) latlng = e.latlng;
        else latlng = this.getCenter();
        this.map.panTo(latlng);
        if (callback) callback();
    },

    zoomTo: function () {
        if (this.map.options.easing) this.flyTo();
        else this.bringToCenter({zoomTo: this.getBestZoom()});
    },

    getBestZoom: function () {
        return this.getOption('zoomTo');
    },

    flyTo: function () {
        this.map.flyTo(this.getCenter(), this.getBestZoom());
    },

    getNext: function () {
        return this.datalayer.getNextFeature(this);
    },

    getPrevious: function () {
        return this.datalayer.getPreviousFeature(this);
    },

    cloneProperties: function () {
        var properties = L.extend({}, this.properties);
        properties._storage_options = L.extend({}, properties._storage_options);
        if (Object.keys && Object.keys(properties._storage_options).length === 0) {
            delete properties._storage_options;  // It can make a difference on big data sets
        }
        return properties;
    },

    deleteProperty: function (property) {
        delete this.properties[property];
        this.makeDirty();
    },

    renameProperty: function (from, to) {
        this.properties[to] = this.properties[from];
        this.deleteProperty(from);
    },

    toGeoJSON: function () {
        var geojson = this.parentClass.prototype.toGeoJSON.call(this);
        geojson.properties = this.cloneProperties();
        return geojson;
    },

    addInteractions: function () {
        this.on('contextmenu editable:vertex:contextmenu', this._showContextMenu, this);
        this.on('click', this._onClick);
    },

    _onClick: function (e) {
        if (this.map.measureTools && this.map.measureTools.enabled()) return;
        this._popupHandlersAdded = true;  // Prevent leaflet from managing event
        if(!this.map.editEnabled) {
            this.view(e.latlng);
        } else if (!this.isReadOnly()) {
            new L.Toolbar.Popup(e.latlng, {
                className: 'leaflet-inplace-toolbar',
                anchor: this.getPopupToolbarAnchor(),
                actions: this.getInplaceToolbarActions(e)
            }).addTo(this.map, this, e.latlng);
        }
        L.DomEvent.stop(e);
    },

    getPopupToolbarAnchor: function () {
        return [0, 0];
    },

    getInplaceToolbarActions: function (e) {
        return [L.S.ToggleEditAction, L.S.DeleteFeatureAction];
    },

    _showContextMenu: function (e) {
        L.DomEvent.stop(e);
        var pt = this.map.mouseEventToContainerPoint(e.originalEvent);
        e.relatedTarget = this;
        this.map.contextmenu.showAt(pt, e);
    },

    makeDirty: function () {
        this.isDirty = true;
    },

    getMap: function () {
        return this.map;
    },

    getContextMenuItems: function (e) {
        var items = [];
        if (this.map.editEnabled && !this.isReadOnly()) {
            items = items.concat(this.getContextMenuEditItems(e));
        }
        return items;
    },

    getContextMenuEditItems: function () {
        var items = ['-'];
        if (this.map.editedFeature !== this) {
            items.push(
                {
                    text: L._('Edit this feature'),
                    callback: this.edit,
                    context: this,
                    iconCls: 'storage-edit'
                }
            );
        }
        items = items.concat(
            {
                text: L._('Edit feature\'s layer'),
                callback: this.datalayer.edit,
                context: this.datalayer,
                iconCls: 'storage-edit'
            },
            {
                text: L._('Delete this feature'),
                callback: this.confirmDelete,
                context: this,
                iconCls: 'storage-delete'
            }
        );
        return items;
    },

    onRemove: function (map) {
        this.parentClass.prototype.onRemove.call(this, map);
        if (this.map.editedFeature === this) {
            this.endEdit();
            L.Storage.fire('ui:end');
        }
    },

    resetLabel: function () {
        if (this.label) {
            this.hideLabel();
            delete this.label;
        }
        if (this.getOption('showLabel') && this.properties.name) {
            this.bindLabel(L.Util.escapeHTML(this.properties.name), {noHide: true});
            this.showLabel();
        }
    },

    matchFilter: function (filter, keys) {
        filter = filter.toLowerCase();
        for (var i = 0; i < keys.length; i++) {
            if ((this.properties[keys[i]] || '').toLowerCase().indexOf(filter) !== -1) return true;
        }
        return false;
    },

    onVertexRawClick: function (e) {
        new L.Toolbar.Popup(e.latlng, {
            className: 'leaflet-inplace-toolbar',
            actions: this.getVertexActions(e)
        }).addTo(this.map, this, e.latlng, e.vertex);
    },

    getVertexActions: function () {
        return [L.S.DeleteVertexAction];
    },

    isMulti: function () {
        return false;
    }

};

L.Storage.Marker = L.Marker.extend({
    parentClass: L.Marker,
    includes: [L.Storage.FeatureMixin, L.Mixin.Events],

    preInit: function () {
        this.setIcon(this.getIcon());
    },

    addInteractions: function () {
        L.Storage.FeatureMixin.addInteractions.call(this);
        this.on('dragend', function (e) {
            this.isDirty = true;
            this.edit(e);
        }, this);
        if (!this.isReadOnly()) {
            this.on('mouseover', this._enableDragging);
        }
        this.on('mouseout', this._onMouseOut);
        this._popupHandlersAdded = true; // prevent Leaflet from binding event on bindPopup
    },

    _onMouseOut: function () {
        if(this.dragging && this.dragging._draggable && !this.dragging._draggable._moving) {
            // Do not disable if the mouse went out while dragging
            this._disableDragging();
        }
    },

    _enableDragging: function () {
        // TODO: start dragging after 1 second on mouse down
        if(this.map.editEnabled) {
            if (!this.editEnabled()) this.enableEdit();
            // Enabling dragging on the marker override the Draggable._OnDown
            // event, which, as it stopPropagation, refrain the call of
            // _onDown with map-pane element, which is responsible to
            // set the _moved to false, and thus to enable the click.
            // We should find a cleaner way to handle this.
            this.map.dragging._draggable._moved = false;
        }
    },

    _disableDragging: function () {
        if(this.map.editEnabled) {
            if (this.editor && this.editor.drawing) return;  // when creating a new marker, the mouse can trigger the mouseover/mouseout event
                                                             // do not listen to them
            this.disableEdit();
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
        this.resetLabel();
    },

    disconnectFromDataLayer: function (datalayer) {
        this.options.icon.datalayer = null;
        L.Storage.FeatureMixin.disconnectFromDataLayer.call(this, datalayer);
    },

    _getIconUrl: function (name) {
        if (typeof name === 'undefined') {
            name = 'icon';
        }
        return this.getOption(name + 'Url');
    },

    getIconClass: function () {
        return this.getOption('iconClass');
    },

    getIcon: function () {
        var Class = L.Storage.Icon[this.getIconClass()] || L.Storage.Icon.Default;
        return new Class(this.map, {feature: this});
    },

    getCenter: function () {
        return this._latlng;
    },

    getClassName: function () {
        return 'marker';
    },

    getAdvancedOptions: function () {
        return [
            'properties._storage_options.color',
            'properties._storage_options.iconClass',
            'properties._storage_options.iconUrl',
            'properties._storage_options.zoomTo',
            'properties._storage_options.showLabel'
        ];
    },

    appendEditFieldsets: function (container) {
        L.Storage.FeatureMixin.appendEditFieldsets.call(this, container);
        var coordinatesOptions = [
            ['_latlng.lat', {handler: 'FloatInput', label: L._('Latitude')}],
            ['_latlng.lng', {handler: 'FloatInput', label: L._('Longitude')}]
        ];
        var builder = new L.S.FormBuilder(this, coordinatesOptions, {
            callback: function () {
                this._redraw();
                this.bringToCenter();
            },
            callbackContext: this
        });
        var fieldset = L.DomUtil.createFieldset(container, L._('Coordinates'));
        fieldset.appendChild(builder.build());
    },

    bringToCenter: function (e, callback) {
        callback = callback || function (){};  // mandatory for zoomToShowLayer
        if (this.datalayer.isClustered() && !this._icon) {
            this.datalayer.layer.zoomToShowLayer(this, callback);
        } else {
            L.Storage.FeatureMixin.bringToCenter.call(this, e, callback);
        }
    },

    isOnScreen: function () {
        var bounds = this.map.getBounds();
        return bounds.contains(this._latlng);
    },

    getPopupToolbarAnchor: function () {
        return this.options.icon.options.popupAnchor;
    }

});


L.Storage.PathMixin = {

    edit: function (e) {
        if(this.map.editEnabled) {
            if (!this.editEnabled()) this.enableEdit();
            L.Storage.FeatureMixin.edit.call(this, e);
        }
    },

    _toggleEditing: function(e) {
        if(this.map.editEnabled) {
            if(this.editEnabled()) {
                this.endEdit();
                L.Storage.fire('ui:end');
            }
            else {
                this.edit(e);
            }
        }
        // FIXME: disable when disabling global edit
        L.DomEvent.stop(e);
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
        'dashArray',
        'interactive'
    ],

    getAdvancedOptions: function () {
        return [
            'properties._storage_options.color',
            'properties._storage_options.opacity',
            'properties._storage_options.weight',
            'properties._storage_options.smoothFactor',
            'properties._storage_options.dashArray',
            'properties._storage_options.zoomTo'
        ];
    },

    setStyle: function (options) {
        options = options || {};
        var option;
        for (var idx in this.styleOptions) {
            option = this.styleOptions[idx];
            options[option] = this.getOption(option);
        }
        if (options.interactive) this.options.pointerEvents = 'visiblePainted';
        else this.options.pointerEvents = 'stroke';
        this.parentClass.prototype.setStyle.call(this, options);
    },

    _redraw: function () {
        this.setStyle();
    },

    onAdd: function (map) {
        this._container = null;
        this.setStyle();
        // Show tooltip again when Leaflet.label allow static label on path.
        // cf https://github.com/Leaflet/Leaflet.label/pull/97/files
        // this.map.on('showmeasure', this.showMeasureTooltip, this);
        // this.map.on('hidemeasure', this.removeTooltip, this);
        this.parentClass.prototype.onAdd.call(this, map);
        if (this.editing && this.editing.enabled()) {
            this.editing.addHooks();
        }
    },

    onRemove: function (map) {
        // this.map.off('showmeasure', this.showMeasureTooltip, this);
        // this.map.off('hidemeasure', this.removeTooltip, this);
        if (this.editing && this.editing.enabled()) {
            this.editing.removeHooks();
        }
        L.S.FeatureMixin.onRemove.call(this, map);
    },

    getBestZoom: function () {
        if (this.options.zoomTo) {
            return this.options.zoomTo;
        } else {
            var bounds = this.getBounds();
            return this.map.getBoundsZoom(bounds, true);
        }
    },

    endEdit: function () {
        this.disableEdit();
        L.Storage.FeatureMixin.endEdit.call(this);
    },

    _onMouseOver: function () {
        if (this.map.measureTools && this.map.measureTools.enabled()) {
            L.Storage.fire('ui:tooltip', {content: this.getMeasure()});
            this.once('mouseout', function () { L.Storage.fire('ui:tooltip:abort');});
        } else if (this.map.editEnabled && !this.map.editedFeature) {
            L.Storage.fire('ui:tooltip', {content: L._('Click to edit')});
            this.once('mouseout', function () { L.Storage.fire('ui:tooltip:abort');});
        }
    },

    addInteractions: function () {
        L.Storage.FeatureMixin.addInteractions.call(this);
        this.on('dragend', this.edit);
        this.on('mouseover', this._onMouseOver);
        this.on('edit', this.makeDirty);
    },

    transferShape: function (at, to) {
        var shape = this.enableEdit().deleteShapeAt(at);
        this.disableEdit();
        if (!shape) return;
        to.enableEdit().appendShape(shape);
        if (!this._latlngs.length || !this._latlngs[0].length) this.del();
    },

    isolateShape: function (at) {
        if (!this.isMulti()) return;
        var shape = this.enableEdit().deleteShapeAt(at);
        this.disableEdit();
        if (!shape) return;
        console.log(shape)
        var properties = this.cloneProperties();
        var other = new (this instanceof L.S.Polyline ? L.S.Polyline : L.S.Polygon)(this.map, shape, {geojson: {properties: properties}});
        this.datalayer.addLayer(other);
        other.edit();
        return other;
    },

    getContextMenuItems: function (e) {
        var items = L.S.FeatureMixin.getContextMenuItems.call(this, e);
        if (this.map.editEnabled && !this.isReadOnly() && this.isMulti()) {
            items = items.concat(this.getContextMenuMultiItems(e));
        }
        return items;
    },

    getContextMenuMultiItems: function (e) {
        var items = ['-', {
            text: L._('Remove shape from the multi'),
            callback: function () {
                this.enableEdit().deleteShapeAt(e.latlng);
            },
            context: this
        }];
        var shape = this.shapeAt(e.latlng);
        if (this._latlngs.indexOf(shape) > 0) {
            items.push({
                text: L._('Make main shape'),
                callback: function () {
                    this.enableEdit().deleteShape(shape);
                    this.editor.prependShape(shape);
                },
                context: this
            });
        }
        return items;
    },

    getContextMenuEditItems: function (e) {
        var items = L.S.FeatureMixin.getContextMenuEditItems.call(this, e);
        if (this.map.editedFeature && this.isSameClass(this.map.editedFeature) && this.map.editedFeature !== this) {
            items.push({
                text: L._('Transfer shape to edited feature'),
                callback: function () {
                    this.transferShape(e.latlng, this.map.editedFeature);
                },
                context: this
            });
        }
        if (this.isMulti()) {
            items.push({
                text: L._('Extract shape to separate feature'),
                callback: function () {
                    this.isolateShape(e.latlng, this.map.editedFeature);
                },
                context: this
            });
        }
        return items;
    },

    getInplaceToolbarActions: function (e) {
        var items = L.S.FeatureMixin.getInplaceToolbarActions.call(this, e);
        if (this.isMulti()) {
            items.push(L.S.DeleteShapeAction);
            items.push(L.S.ExtractShapeFromMultiAction);
        }
        return items;
    },

    isOnScreen: function () {
        var bounds = this.map.getBounds();
        return bounds.overlaps(this.getBounds());
    }

};

L.Storage.Polyline = L.Polyline.extend({
    parentClass: L.Polyline,
    includes: [L.Storage.FeatureMixin, L.Storage.PathMixin, L.Mixin.Events],

    staticOptions: {
        stroke: true,
        fill: false
    },

    isSameClass: function (other) {
        return other instanceof L.S.Polyline;
    },

    getClassName: function () {
        return 'polyline';
    },

    getMeasure: function () {
        var length = L.GeoUtil.lineLength(this.map, this._defaultShape());
        return L.GeoUtil.readableDistance(length, this.map.measureTools.getMeasureUnit());
    },

    getContextMenuEditItems: function (e) {
        var items = L.S.PathMixin.getContextMenuEditItems.call(this, e),
            vertexClicked = e.vertex, index;
        if (!this.isMulti()) {
            items.push({
                text: L._('Transform to polygon'),
                callback: this.toPolygon,
                context: this
            });
        }
        if (vertexClicked) {
            index = e.vertex.getIndex();
            if (index !== 0 && index !== e.vertex.getLastIndex()) {
                items.push({
                    text: L._('Split line'),
                    callback: e.vertex.split,
                    context: e.vertex
                });
            } else if (index === 0 || index === e.vertex.getLastIndex()) {
                items.push({
                    text: L._('Continue line (Ctrl-click)'),
                    callback: e.vertex.continue,
                    context: e.vertex.continue
                });
            }
        }
        return items;
    },

    getContextMenuMultiItems: function (e) {
        var items = L.S.PathMixin.getContextMenuMultiItems.call(this, e);
        items.push({
            text: L._('Merge lines'),
            callback: this.mergeShapes,
            context: this
        });
        return items;
    },

    toPolygon: function () {
        var geojson = this.toGeoJSON();
        geojson.geometry.type = 'Polygon';
        geojson.geometry.coordinates = [L.Util.flattenCoordinates(geojson.geometry.coordinates)];
        var polygon = this.datalayer.geojsonToFeatures(geojson);
        polygon.edit();
        this.del();
    },

    getAdvancedEditActions: function (container) {
        L.Storage.FeatureMixin.getAdvancedEditActions.call(this, container);
        var toPolygon = L.DomUtil.create('a', 'storage-to-polygon', container);
        toPolygon.href = '#';
        toPolygon.innerHTML = L._('Transform to polygon');
        L.DomEvent.on(toPolygon, 'click', this.toPolygon, this);
    },

    _mergeShapes: function (from, to) {
        var toLeft = to[0],
            toRight = to[to.length - 1],
            fromLeft = from[0],
            fromRight = from[from.length - 1],
            l2ldistance = toLeft.distanceTo(fromLeft),
            l2rdistance = toLeft.distanceTo(fromRight),
            r2ldistance = toRight.distanceTo(fromLeft),
            r2rdistance = toRight.distanceTo(fromRight),
            toMerge;
        if (l2rdistance < Math.min(l2ldistance, r2ldistance, r2rdistance)) {
            toMerge = [from, to];
        } else if (r2ldistance < Math.min(l2ldistance, l2rdistance, r2rdistance)) {
            toMerge = [to, from];
        } else if (r2rdistance < Math.min(l2ldistance, l2rdistance, r2ldistance)) {
            from.reverse();
            toMerge = [to, from];
        } else {
            from.reverse();
            toMerge = [from, to];
        }
        var a = toMerge[0],
            b = toMerge[1],
            p1 = this.map.latLngToContainerPoint(a[a.length - 1]),
            p2 = this.map.latLngToContainerPoint(b[0]),
            tolerance = 5; // px on screen
        if (Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance) {
            a.pop();
        }
        return a.concat(b);
    },

    mergeShapes: function () {
        if (!this.isMulti()) return;
        var latlngs = this.getLatLngs();
        if (!latlngs.length) return;
        while (latlngs.length > 1) {
            latlngs.splice(0, 2, this._mergeShapes(latlngs[1], latlngs[0]));
        }
        this.setLatLngs(latlngs[0]);
        if (!this.editEnabled()) this.edit();
        this.editor.reset();
        this.isDirty = true;
    },

    isMulti: function () {
        return !L.Polyline._flat(this._latlngs) && this._latlngs.length > 1;
    },

    getVertexActions: function (e) {
        var actions = L.S.FeatureMixin.getVertexActions.call(this, e),
            index = e.vertex.getIndex();
        if (index === 0 || index === e.vertex.getLastIndex()) actions.push(L.S.ContinueLineAction);
        else actions.push(L.S.SplitLineAction);
        return actions;
    }

});

L.Storage.Polygon = L.Polygon.extend({
    parentClass: L.Polygon,
    includes: [L.Storage.FeatureMixin, L.Storage.PathMixin, L.Mixin.Events],

    isSameClass: function (other) {
        return other instanceof L.S.Polygon;
    },

    getClassName: function () {
        return 'polygon';
    },

    getAdvancedOptions: function () {
        var options = L.Storage.PathMixin.getAdvancedOptions();
        options.push('properties._storage_options.stroke',
            'properties._storage_options.fill',
            'properties._storage_options.fillColor',
            'properties._storage_options.fillOpacity'
        );
        options.push(['properties._storage_options.outlink', {label: L._('outlink'), helpText: L._('Define output link to open a new window on polygon click.'), placeholder: 'http://...'}]);
        options.push(['properties._storage_options.interactive', {handler: 'NullableBoolean', label: L._('Mouse interactions'), helpText: L._('If false, the polygon will act as a part of the underlying map.')}]);
        return options;
    },

    getMeasure: function () {
        var area = L.GeoUtil.geodesicArea(this._defaultShape());
        return L.GeoUtil.readableArea(area, this.map.measureTools.getMeasureUnit());
    },

    getContextMenuEditItems: function (e) {
        var items = L.S.PathMixin.getContextMenuEditItems.call(this, e),
            shape = this.shapeAt(e.latlng);
        // No multi and no holes.
        if (shape && !this.isMulti() && (L.Polyline._flat(shape) || shape.length === 1)) {
            items.push({
                text: L._('Transform to lines'),
                callback: this.toPolyline,
                context: this
            });
        }
        items.push({
            text: L._('Start a hole here'),
            callback: this.startHole,
            context: this
        });
        return items;
    },

    startHole: function (e) {
        this.enableEdit().newHole(e.latlng);
    },

    toPolyline: function () {
        var geojson = this.toGeoJSON();
        geojson.geometry.type = 'LineString';
        geojson.geometry.coordinates = L.Util.flattenCoordinates(geojson.geometry.coordinates);
        var polyline = this.datalayer.geojsonToFeatures(geojson);
        polyline.edit();
        this.del();
    },

    getAdvancedEditActions: function (container) {
        L.Storage.FeatureMixin.getAdvancedEditActions.call(this, container);
        var toPolyline = L.DomUtil.create('a', 'storage-to-polyline', container);
        toPolyline.href = '#';
        toPolyline.innerHTML = L._('Transform to lines');
        L.DomEvent.on(toPolyline, 'click', this.toPolyline, this);
    },

    isMulti: function () {
        // Change me when Leaflet#3279 is merged.
        return !L.Polyline._flat(this._latlngs) && !L.Polyline._flat(this._latlngs[0]) && this._latlngs.length > 1;
    },

    getInplaceToolbarActions: function (e) {
        var items = L.S.PathMixin.getInplaceToolbarActions.call(this, e);
        items.push(L.S.CreateHoleAction);
        return items;
    }

});
