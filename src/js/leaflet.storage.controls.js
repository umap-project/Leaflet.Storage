/*
* Hack for handling a custom tooltip on buttons over.
*/
L.Toolbar.prototype._createButtonOrig = L.Toolbar.prototype._createButton;

L.Toolbar.include({

    _createButton: function (options) {
        var title = options.title;
        options.title = "";  // We don't want our tooltip AND default HTML one
        var button = this._createButtonOrig(options);
        L.DomEvent.on(button, 'mouseover', function (e) {
            L.Storage.fire('ui:tooltip', {content: L._(title)});
        });
        return button;
    },

    _showActionsToolbar: function () {
        var buttonIndex = this._activeMode.buttonIndex,
        lastButtonIndex = this._lastButtonIndex,
        buttonWidth = 46, // TODO: this should be calculated
        borderWidth = 1, // TODO: this should also be calculated
        toolbarPosition = (buttonIndex * buttonWidth) + (buttonIndex * borderWidth) + 10;

        // Correctly position the cancel button
        this._actionsContainer.style.left = toolbarPosition + 'px';

        if (buttonIndex === 0) {
            L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
            L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-top');
        }

        if (buttonIndex === lastButtonIndex) {
            L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
            L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
        }

        this._actionsContainer.style.display = 'block';
    }

});

L.Storage.SettingsToolbar = L.Toolbar.extend({

    addToolbar: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-draw-section'),
        buttonIndex = 0,
        buttonClassPrefix = 'leaflet-draw-draw';
        this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

        this._createUploadButton(map, this._toolbarContainer);
        this._createUpdateMapExtentButton(map, this._toolbarContainer);
        this._createUpdateMapTileLayersButton(map, this._toolbarContainer);
        this._createUpdateMapPermissionsButton(map, this._toolbarContainer);
        this._createUpdateMapInfosButton(map, this._toolbarContainer);
        this._createUpdateMapSettingsButton(map, this._toolbarContainer);

        container.appendChild(this._toolbarContainer);
        return container;
    },

    _createUploadButton: function(map, container) {
        this._createButton({
            title: L._('Upload data'),
            className: 'upload-data',
            container: container,
            callback: map.uploadData,
            context: map
        });
    },

    _createUpdateMapSettingsButton: function(map, container) {
        this._createButton({
            title: L._('Edit map settings'),
            className: 'update-map-settings',
            container: container,
            callback: map.updateSettings,
            context: map
        });
    },

    _createUpdateMapInfosButton: function(map, container) {
        this._createButton({
            title: L._('Edit map infos'),
            className: 'update-map-infos',
            container: container,
            callback: map.updateInfos,
            context: map
        });
    },

    _createUpdateMapPermissionsButton: function(map, container) {
        this._createButton({
            title: L._('Update permissions and editors'),
            className: 'update-map-permissions',
            container: container,
            callback: map.updatePermissions,
            context: map
        });
    },

    _createUpdateMapTileLayersButton: function(map, container) {
        this._createButton({
            title: L._('Change tilelayers'),
            className: 'update-map-tilelayers',
            container: container,
            callback: map.updateTileLayers,
            context: map
        });
    },

    _createUpdateMapExtentButton: function(map, container) {
        this._createButton({
            title: L._('Save this center and zoom'),
            className: 'update-map-extent',
            container: container,
            callback: map.updateExtent,
            context: map
        });
    }

});

L.Storage.EditControl = L.Control.Draw.extend({
    options: {
        position: 'topright',
        draw: {
            marker: {
                title: L._('Draw a marker')
            },
            rectangle: null,  // Later
            circle: null  // Later
        },
        edit: false // Later...
    },

    initialize: function(map, options) {
        this.editableLayers = new L.FeatureGroup();
        map.addLayer(this.editableLayers);
        this.options.edit.featureGroup = this.editableLayers;
        this._map = map;
        if (!map.options.enableMarkerDraw) {
            this.options.draw.marker = null;
        } else {
            this.options.draw.marker.icon = new L.Storage.Icon.Default(this._map);
        }
        if (!map.options.enablePolylineDraw) {
            this.options.draw.polyline = null;
        }
        if (!map.options.enablePolygonDraw) {
            this.options.draw.polygon = null;
        }

        L.Control.Draw.prototype.initialize.call(this, options);

        // Settings toolbar
        var toolbar = new L.Storage.SettingsToolbar();
        id = L.stamp(toolbar);
        this._toolbars[id] = toolbar;
        // Listen for when toolbar is enabled
        this._toolbars[id].on('enable', this._toolbarEnabled, this);
    },

    onAdd: function (map) {
        var container = L.Control.Draw.prototype.onAdd.call(this, map);
        this._createToggleButton(map, container);
        return container;
    },

    _enableEdit: function(e, map) {
        L.DomUtil.addClass(map._container, "storage-edit-enabled");
        map.editEnabled = true;
    },

    _disableEdit: function(e, map, container) {
        L.DomUtil.removeClass(map._container, "storage-edit-enabled");
        map.editEnabled = false;
        // this._disableInactiveModes();
    },

    _createToggleButton: function (map, container) {
        var self = this;
        var link = L.DomUtil.create('a', "leaflet-draw-section leaflet-control-edit-toggle", container);
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
    }

});

L.Storage.Map.addInitHook(function () {
    if (this.options.allowEdit) {
        var options = this.options.editOptions ? this.options.editOptions : {};
        this.toggleEditControl = new L.Storage.EditControl(this, options);
        this.addControl(this.toggleEditControl);
    }
});



L.Draw.Marker.include({

    _fireCreatedEvent: function () {
        // Overriding to instanciate our own Marker class
        // How to do it in a cleaner way? Asking upstream to add a hook?
        var marker = new L.Storage.Marker(this._map, null, this._marker.getLatLng());
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
    }
});

L.Draw.Polyline.include({

    _fireCreatedEvent: function () {
        var poly = new L.Storage.Polyline(this._map, null, this._poly.getLatLngs(), this.options.shapeOptions);
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
    }

});

L.Draw.Polygon.include({

    _fireCreatedEvent: function () {
        var poly = new L.Storage.Polygon(this._map, null, this._poly.getLatLngs(), this.options.shapeOptions);
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
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
        this._createNewDataLayerButton(map, container);
        return container;
    },

    _addItem: function (obj) {
        // Obj is and object {storage_layer, name, (bool)overlay}
        var label = L.Control.Layers.prototype._addItem.call(this, obj),
            map = this._map,
            self = this;

        if (obj.overlay) {
            var link = L.DomUtil.create('a', "edit-datalayer", label);
            link.innerHTML = link.title = L._('Edit');
            link.href = '#';
            link.id = 'edit_datalayer_' + obj.layer.storage_id;
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

    _createNewDataLayerButton: function (map, container) {
        var link = L.DomUtil.create('a', "edit-datalayer add-datalayer", container);
        link.innerHTML = link.title = L._('Add a layer');
        link.href = '#';
        var self = this;
        var fn = function (e) {
            var url = L.Util.template(this.options.urls.datalayer_add, {'map_id': map.options.storage_id});
            L.Storage.Xhr.get(url, {
                'callback': function (data) {
                    var datalayer = map._createDataLayer({});
                    return datalayer._handleEditResponse(data);
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
