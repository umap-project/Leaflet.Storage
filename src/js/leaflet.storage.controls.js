L.Control.ToggleEdit = L.Control.Draw.extend({
    options: {
        position: 'topright',
        rectangle: null,  // Later
        circle: null  // Later
    },

    initialize: function(map, options) {
        this._map = map;
        if (!map.options.enableMarkerDraw) {
            options.marker = null;
        }
        if (!map.options.enablePolylineDraw) {
            options.polyline = null;
        }
        if (!map.options.enablePolygonDraw) {
            options.polygon = null;
        }
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
        this._createUpdateMapSettingsButton(map, container);
        this._createToggleButton(map, container);
        return container;
    },

    _createToggleButton: function (map, container) {
        var self = this;
        var link = L.DomUtil.create('a', "leaflet-control-edit-toggle", container);
        link.href = '#';
        link.title = L._("Enable/disable editing");

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
            L._('Save this center and zoom'),
            'update-map-extent',
            container,
            function(e) { map.updateExtent();},
            {}
        );
    },

    _createUpdateMapTileLayersButton: function(map, container) {
        this._createButton(
            L._('Change tilelayers'),
            'update-map-tilelayers',
            container,
            function(e) { map.updateTileLayers();},
            {}
        );
    },

    _createUpdateMapPermissionsButton: function(map, container) {
        this._createButton(
            L._('Update permissions and editors'),
            'update-map-permissions',
            container,
            function(e) { map.updatePermissions();},
            {}
        );
    },

    _createUpdateMapInfosButton: function(map, container) {
        this._createButton(
            L._('Edit map infos'),
            'update-map-infos',
            container,
            function(e) { map.updateInfos();},
            {}
        );
    },

    _createUpdateMapSettingsButton: function(map, container) {
        this._createButton(
            L._('Edit map settings'),
            'update-map-settings',
            container,
            function(e) { map.updateSettings();},
            {}
        );
    },

    _createUploadButton: function(map, container) {
        this._createButton(
            L._('Upload data'),
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
            L.Storage.fire('ui:tooltip', {content: L._(title)});
        });
        return button;
    }
});

L.Storage.Map.addInitHook(function () {
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
        link.title = L._("Embed this map");
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

L.Storage.Map.addInitHook(function () {
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
        var label = L.Control.Layers.prototype._addItem.call(this, obj),
            map = this._map,
            self = this;

        if (obj.overlay) {
            var link = L.DomUtil.create('a', "edit-overlay", label);
            link.innerHTML = link.title = L._('Edit');
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
        link.innerHTML = link.title = L._('Add a category');
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
        position: 'topright'
    },

    onAdd: function (map) {
        var className = 'leaflet-control-infos',
            container = L.DomUtil.create('div', className);

        var link = L.DomUtil.create('a', "", container);
        link.href = '#';
        link.title = L._("Caption and credits");

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', map.displayCaption, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.Storage.Map.addInitHook(function () {
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
            container = L.DomUtil.create('div', className),
            link = L.DomUtil.create('a', "", container);

        link.href = '/';
        link.title = L._("Go to home page");

        return container;
    }
});
L.Storage.Map.addInitHook(function () {
    if (this.options.homeControl) {
        this.homeControl = (new L.Storage.HomeControl()).addTo(this);
    }
});


L.Storage.LocateControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var className = 'leaflet-control-locate',
            container = L.DomUtil.create('div', className),
            link = L.DomUtil.create('a', "", container);
        link.href = '#';
        link.title = L._("Center map on your location");
        var fn = function (e) {
            map.locate({
                setView: true,
                enableHighAccuracy: true
            });
        };

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;    }
});
L.Storage.Map.addInitHook(function () {
    if (this.options.locateControl) {
        this.locateControl = (new L.Storage.LocateControl()).addTo(this);
    }
});


L.Storage.JumpToLocationControl = L.Control.extend({

    options: {
        position: 'topleft',
        server_url: 'http://open.mapquestapi.com/nominatim/v1/search.php'
    },

    onAdd: function (map) {
        var className = 'leaflet-control-search',
            container = L.DomUtil.create('div', className),
            self = this;

        L.DomEvent.disableClickPropagation(container);
        var link = L.DomUtil.create('a', "", container);
        var form = L.DomUtil.create('form', "", container);
        var input = L.DomUtil.create('input', "", form);
        link.href = '#';
        link.title = input.placeholder = L._("Jump to location");
        link.innerHTML = "&nbsp;";
        var fn = function (e) {
            var search_terms = input.value;
            if (!search_terms) {
                return;
            }
            L.DomUtil.addClass(link, 'loading');
            var url = [],
                bounds = map.getBounds(),
                viewbox = [
                    //left,top,right,bottom,
                    bounds.getNorthWest().lng,
                    bounds.getNorthWest().lat,
                    bounds.getSouthEast().lng,
                    bounds.getSouthEast().lat
                ];
            viewbox = viewbox.join(',');
            var params = {
                format: 'json',
                q: search_terms,
                viewbox: viewbox, // this is just a preferred area, not a constraint
                limit: 1
            };
            url = self.options.server_url + "?" + L.S.Xhr.buildQueryString(params);
            L.Storage.Xhr.get(url, {
                callback: function (data) {
                    L.DomUtil.removeClass(link, 'loading');
                    if (data.length > 0 && data[0].lon && data[0].lat) {
                        map.panTo([data[0].lat, data[0].lon]);
                        map.setZoom(15);
                    }
                    else {
                        L.S.fire('ui:alert', {content: L._('Sorry, no location found for {location}', {location: search_terms})});
                    }
                }
            });
        };

        L.DomEvent
            .on(form, 'submit', L.DomEvent.stopPropagation)
            .on(form, 'submit', L.DomEvent.preventDefault)
            .on(form, 'submit', fn);
        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;    }
});
L.Storage.Map.addInitHook(function () {
    if (this.options.jumpToLocationControl) {
        this.jumpToLocationControl = (new L.Storage.JumpToLocationControl()).addTo(this);
    }
});
