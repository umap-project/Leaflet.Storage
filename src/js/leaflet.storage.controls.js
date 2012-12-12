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
        link.title = "Enable/disable editing";

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
            'Save this center and zoom',
            'update-map-extent',
            container,
            function(e) { map.updateExtent();},
            {}
        );
    },

    _createUpdateMapTileLayersButton: function(map, container) {
        this._createButton(
            'Change tilelayers',
            'update-map-tilelayers',
            container,
            function(e) { map.updateTileLayers();},
            {}
        );
    },

    _createUpdateMapPermissionsButton: function(map, container) {
        this._createButton(
            'Update permissions and editors',
            'update-map-permissions',
            container,
            function(e) { map.updatePermissions();},
            {}
        );
    },

    _createUpdateMapInfosButton: function(map, container) {
        this._createButton(
            'Edit map infos',
            'update-map-infos',
            container,
            function(e) { map.updateInfos();},
            {}
        );
    },

    _createUploadButton: function(map, container) {
        this._createButton(
            'Upload data',
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
        link.title = "Embed this map";
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
        // TODO: DRYME when leaflet #1167 is in dist
        var label = document.createElement('label'),
            input,
            map = this._map,
            self = this,
            checked = map.hasLayer(obj.layer);

        if (obj.overlay) {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'leaflet-control-layers-selector';
            input.defaultChecked = checked;
        } else {
            input = this._createRadioElement('leaflet-base-layers', checked);
        }

        input.layerId = L.stamp(obj.layer);

        L.DomEvent.on(input, 'click', this._onInputClick, this);

        var name = document.createElement('span');
        name.innerHTML = ' ' + obj.name;

        label.appendChild(input);
        label.appendChild(name);

        if (obj.overlay) {
            var link = L.DomUtil.create('a', "edit-overlay", label);
            link.innerHTML = link.title = 'Edit';
            link.href = '#';
            var fn = function (e) {
                var url = obj.layer.getEditUrl();
                L.Storage.Xhr.get(url, {
                    'callback': function (data) {return self._handleEditResponse(data);}
                });
            };
            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', fn, map);
        }

        var container = obj.overlay ? this._overlaysList : this._baseLayersList;
        container.appendChild(label);
    },

    _handleEditResponse: function(data) {
        var map = this._map,
            form_id = "category_edit",
            self = this;
        L.Storage.fire('modal_ready', {'data': data});
        L.Storage.Xhr.listen_form(form_id, {
            'callback': function (data) {
                if (data.category) {
                    /* Means success */
                    if (typeof map.storage_overlays[data.category.pk] !== "undefined") {
                        // TODO update instead of removing/recreating
                        var layer = map.storage_overlays[data.category.pk];
                        map.removeLayer(layer);
                        self.removeLayer(layer);
                    }
                    map._createOverlay(data.category);
                    L.Storage.fire('alert', {'content':"Category successfuly edited", 'level': 'info'});
                    L.Storage.fire('modal_close');
                }
                else {
                    // Let's start again
                    self._handleEditResponse(data);
                }
            }
        });
    },

    _createNewOverlayButton: function (map, container) {
        var link = L.DomUtil.create('a', "edit-overlay add-overlay", container);
        link.innerHTML = link.title = 'Add a category';
        link.href = '#';
        var self = this;
        var fn = function (e) {
            var url = L.Util.template(this.options.urls.category_add, {'map_id': map.options.storage_id});
            L.Storage.Xhr.get(url, {
                'callback': function (data) {return self._handleEditResponse(data);}
            });
        };
        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);
    }
});

L.Map.addInitHook(function () {
    // this.storage_layers_control is created in Map initialize
    if (this.options.layersControl) {
        this.addControl(this.storage_layers_control);
    }
});
