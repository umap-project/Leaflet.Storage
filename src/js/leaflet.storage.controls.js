L.Control.ToggleEdit = L.Control.Draw.extend({
    options: {
        position: 'topright',
        rectangle: null,  // Later
        circle: null  // Later
    },

    initialize: function(map, options) {
        this._map = map;
        L.Control.Draw.prototype.initialize.call(this, options);
        if (this.options.marker) {
            this.options.marker.icon = new L.Storage.Icon.Default(this._map);
        }
    },

    onAdd: function (map) {
        var container = L.Control.Draw.prototype.onAdd.call(this, map);
        this._createUploadButton(map, container);
        this._createUpdateMapExtentButton(map, container);
        this._createUpdateMapTileLayersButton(map, container);
        this._createUpdateMapPermissionsButton(map, container);
        this._createUpdateMapInfosButton(map, container);
        this._createToggleButton(map, container);
        return container;
    },

    _createToggleButton: function (map, container) {
        var self = this;
        var link = L.DomUtil.create('a', "leaflet-control-edit-toggle", container);
        link.href = '#';
        link.title = L.S._("Enable/disable editing");

        var fn = function (e) {
            if(map.editEnabled) {
                self._disableEdit(e, map);
            }
            else {
                self._enableEdit(e, map);
            }
        };
        L.DomEvent
        .addListener(link, 'click', L.DomEvent.stopPropagation)
        .addListener(link, 'click', L.DomEvent.preventDefault)
        .addListener(link, 'click', fn);
    },

    _createUpdateMapExtentButton: function(map, container) {
        this._createButton(
            L.S._('Save this center and zoom'),
            'update-map-extent',
            container,
            function(e) { map.updateExtent();},
            {}
        );
    },

    _createUpdateMapTileLayersButton: function(map, container) {
        this._createButton(
            L.S._('Change tilelayers'),
            'update-map-tilelayers',
            container,
            function(e) { map.updateTileLayers();},
            {}
        );
    },

    _createUpdateMapPermissionsButton: function(map, container) {
        this._createButton(
            L.S._('Update permissions and editors'),
            'update-map-permissions',
            container,
            function(e) { map.updatePermissions();},
            {}
        );
    },

    _createUpdateMapInfosButton: function(map, container) {
        this._createButton(
            L.S._('Edit map infos'),
            'update-map-infos',
            container,
            function(e) { map.updateInfos();},
            {}
        );
    },

    _createUploadButton: function(map, container) {
        this._createButton(
            L.S._('Upload data'),
            'upload-data',
            container,
            function() { map.uploadData(); },
            {}
        );
    },

    _enableEdit: function(e, map) {
        L.DomUtil.addClass(map._container, "storage-edit-enabled");
        map.editEnabled = true;
    },

    _disableEdit: function(e, map, container) {
        L.DomUtil.removeClass(map._container, "storage-edit-enabled");
        map.editEnabled = false;
        this._disableInactiveModes();
    },

    _createButton: function (title, className, container, fn, context) {
        var button = L.Control.Draw.prototype._createButton.call(this, title, className, container, fn, context);
        button.title = "";  // We don't want our tooltip AND default HTML one
        L.DomEvent.on(button, 'mouseover', function (e) {
            console.log(e);
            var event = {
                content: L.S._(title),
                point: L.DomEvent.getMousePosition(e),
                zIndex: 1001
            };
            L.Storage.fire('ui:tooltip', event);
        });
    }
});

L.Map.addInitHook(function () {
    if (this.options.allowEdit) {
        var options = this.options.editOptions ? this.options.editOptions : {};
        this.toggleEditControl = new L.Control.ToggleEdit(this, options);
        this.addControl(this.toggleEditControl);
    }
});

L.Marker.Draw.include({

    _onClick: function (e) {
        // Overriding to instanciate our own Marker class
        // How to do it in a cleaner way? Asking upstream to add a hook?
        this._map.fire(
            'draw:marker-created',
            { marker: new L.Storage.Marker(this._map, null, this._marker.getLatLng()) }
        );
        this.disable();
    }
});

L.Polyline.Draw.include({

    _finishShape: function () {
        this._map.fire(
            'draw:poly-created',
            { poly: new L.Storage.Polyline(this._map, null, this._poly.getLatLngs(), this.options.shapeOptions) }
        );
        this.disable();
    }

});

L.Polygon.Draw.include({

    initialize: function(map, options) {
        // Polygon is set not clickable by default by Leaflet.Draw
        // to workaround a bug
        // See: https://github.com/jacobtoye/Leaflet.draw/issues/9
        L.Polyline.Draw.prototype.initialize.call(this, map, options);
        this.options.shapeOptions.clickable = true;
    },

    _finishShape: function () {
        this._map.fire(
            'draw:poly-created',
            { poly: new L.Storage.Polygon(this._map, null, this._poly.getLatLngs(), this.options.shapeOptions) }
        );
        this.disable();
    }

});

/* Share control */
L.Control.Embed = L.Control.extend({

    onAdd: function (map) {
        var className = 'leaflet-control-embed',
            container = L.DomUtil.create('div', className);

        var link = L.DomUtil.create('a', "", container);
        link.href = '#';
        link.title = L.S._("Embed this map");
        var fn = function (e) {
            var url = L.Util.template(this.options.urls.map_embed, {'map_id': map.options.storage_id});
            L.Storage.Xhr.get(url);
        };

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.Map.addInitHook(function () {
    if (this.options.embedControl) {
        var options = this.options.embedOptions ? this.options.embedOptions : {};
        this.embedControl = new L.Control.Embed(this, options);
        this.addControl(this.embedControl);
    }
});

L.Storage.ControlLayers = L.Control.Layers.extend({
    options: {},

    onAdd: function (map) {
        var container = L.Control.Layers.prototype.onAdd.call(this, map);
        this._createNewOverlayButton(map, container);
        return container;
    },

    _addItem: function (obj) {
        // Obj is and object {storage_layer, name, (bool)overlay}
        var label = L.Control.Layers.prototype._addItem.call(this, obj);
            map = this._map,
            self = this;

        if (obj.overlay) {
            var link = L.DomUtil.create('a', "edit-overlay", label);
            link.innerHTML = link.title = L.S._('Edit');
            link.href = '#';
            link.id = 'edit_overlay_' + obj.layer.storage_id;
            var fn = function (e) {
                var url = obj.layer.getEditUrl();
                L.Storage.Xhr.get(url, {
                    'callback': function (data) {return obj.layer._handleEditResponse(data);}
                });
            };
            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', fn, map);
        }
        return label;
    },

    _createNewOverlayButton: function (map, container) {
        var link = L.DomUtil.create('a', "edit-overlay add-overlay", container);
        link.innerHTML = link.title = L.S._('Add a category');
        link.href = '#';
        var self = this;
        var fn = function (e) {
            var url = L.Util.template(this.options.urls.category_add, {'map_id': map.options.storage_id});
            L.Storage.Xhr.get(url, {
                'callback': function (data) {
                    var category = map._createOverlay({});
                    return category._handleEditResponse(data);
                }
            });
        };
        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);
    }
});

L.Storage.AttributionControl = L.Control.extend({

    options: {
        position: 'bottomright'
    },

    onAdd: function (map) {
        var className = 'leaflet-control-infos',
            container = L.DomUtil.create('div', className);

        var link = L.DomUtil.create('a', "", container);
        link.href = '#';
        link.title = L.S._("Caption and credits");
        var fn = function (e) {
            var url = L.Util.template(this.options.urls.map_infos, {'map_id': map.options.storage_id});
            L.Storage.Xhr.get(url);
        };

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.Map.addInitHook(function () {
    if (this.options.storageAttributionControl) {
        this.attributionControl = (new L.Storage.AttributionControl()).addTo(this);
    }
});

L.Storage.HomeControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var className = 'leaflet-control-home',
            container = L.DomUtil.create('div', className);

        var link = L.DomUtil.create('a', "", container);
        link.href = '/';
        link.title = L.S._("Go to home page");

        return container;
    }
});
L.Map.addInitHook(function () {
    if (this.options.homeControl) {
        this.homeControl = (new L.Storage.HomeControl()).addTo(this);
    }
});
