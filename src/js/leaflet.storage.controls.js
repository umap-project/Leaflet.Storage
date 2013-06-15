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

L.Storage.DataLayersControl = L.Control.extend({

    onAdd: function (map) {
        var className = 'leaflet-control-browse',
            container = L.DomUtil.create('div', className),
            actions = L.DomUtil.create('div', 'storage-browse-actions', container);
        this._datalayers_container = L.DomUtil.create('ul', 'storage-browse-datalayers', actions);

        var link = L.DomUtil.create('a', "storage-browse-link", actions);
        link.href = '#';
        link.title = link.innerHTML = L._("Browse data");

        var add = L.DomUtil.create('a', "show-on-edit block add-datalayer", actions);
        add.href = '#';
        add.innerHTML = link.title = L._('Add a layer');

        var toggle = L.DomUtil.create('a', "storage-browse-toggle", container);
        toggle.href = '#';

        L.DomEvent
            .on(toggle, 'click', L.DomEvent.stop);

        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', this.openBrowser, this);

        L.DomEvent
            .on(add, 'click', L.DomEvent.stop)
            .on(add, 'click', this.newDataLayer, this);

        map.whenReady(function () {
            this.update();
        }, this);

        return container;
    },

    update: function () {
        if (this._datalayers_container) {
            this._datalayers_container.innerHTML = '';
            for(var idx in this._map.datalayers) {
                this.addDataLayer(this._map.datalayers[idx]);
            }
        }
    },

    initBrowserLayout: function () {
        this._browser_container = L.DomUtil.create('div', 'storage-browse-data');
        var title = L.DomUtil.create('h3', 'storage-browse-title', this._browser_container);
        var description = L.DomUtil.create('div', '', this._browser_container);
        this._features_container = L.DomUtil.create('div', 'storage-browse-features', this._browser_container);
        title.innerHTML = this._map.name;
        if (this._map.description) {
            var content = L.DomUtil.create('div', 'storage-browse-description', description);
            content.innerHTML = this._map.description;
        }
        return this._browser_container;
    },

    openBrowser: function () {
        if (!this._browser_container) {
            this.initBrowserLayout();
        }
        this._features_container.innerHTML = '';
        for(var idx in this._map.datalayers) {
            this.addFeatures(this._map.datalayers[idx]);
        }
        L.Storage.fire('ui:start', {data: {html: this._browser_container}});
    },

    toggleDataLayer: function (datalayer) {
        var toggle = L.DomUtil.get("browse_data_toggle_" + datalayer.storage_id);
        if (this._map.hasLayer(datalayer)) {
            datalayer.hide();
            this.removeFeatures(datalayer);
            L.DomUtil.addClass(toggle, 'off');
        } else {
            datalayer.display();
            datalayer.whenLoaded(function () {
                this.addFeatures(datalayer);
                L.DomUtil.removeClass(toggle, 'off');
            }, this);
        }
    },

    addDataLayer: function (datalayer) {
        var datalayer_li = L.DomUtil.create('li', '', this._datalayers_container),
            toggle = L.DomUtil.create('span', 'layer-toggle', datalayer_li),
            zoom_to = L.DomUtil.create('span', 'layer-zoom_to', datalayer_li),
            edit = L.DomUtil.create('span', "layer-edit show-on-edit", datalayer_li);
            title = L.DomUtil.create('span', 'layer-title', datalayer_li);

        zoom_to.title = L._('Zoom to layer extent');
        toggle.title = L._('Show/hide layer');
        datalayer_li.id = "browse_data_toggle_" + datalayer.storage_id;
        L.DomUtil.addClass(datalayer_li, this._map.hasLayer(datalayer) ? 'on': 'off');

        edit.title = L._('Edit');
        edit.href = '#';
        edit.id = 'edit_datalayer_' + datalayer.storage_id;

        title.innerHTML = datalayer.storage_name;
        L.DomEvent.on(toggle, 'click', function (e) { this.toggleDataLayer(datalayer); }, this);
        L.DomEvent.on(zoom_to, 'click', datalayer.zoomTo, datalayer);
        var do_edit = function (e) {
            var url = datalayer.getEditUrl();
            L.Storage.Xhr.get(url, {
                'callback': function (data) {return datalayer._handleEditResponse(data);}
            });
        };
        L.DomEvent.on(edit, 'click', do_edit, this._map);
    },

    addFeatures: function (datalayer) {
        var id = 'browse_data_datalayer_' + datalayer.storage_id;
        var container = L.DomUtil.get(id);
        if (!container) {
            container = L.DomUtil.create('div', '', this._features_container);
            container.id = id;
        }
        container.innerHTML = "";
        datalayer.whenLoaded(function () {
            if (this._map.hasLayer(datalayer)) {
                var title = L.DomUtil.create('h5', '', container),
                    ul = L.DomUtil.create('ul', '', container);
                title.innerHTML = datalayer.storage_name;
                for (var j in datalayer._layers) {
                    ul.appendChild(this.addFeature(datalayer._layers[j]));
                }
            }
        }, this);
    },

    addFeature: function (feature) {
        var feature_li = L.DomUtil.create('li', feature.getClassName()),
            zoom_to = L.DomUtil.create('span', 'feature-zoom_to', feature_li),
            color = L.DomUtil.create('span', 'feature-color', feature_li),
            title = L.DomUtil.create('span', 'feature-title', feature_li),
            symbol = feature._getIconUrl ? feature._getIconUrl(): null;
        zoom_to.title = L._("Bring feature to center");
        title.innerHTML = feature.name;
        color.style.backgroundColor = feature.getOption('color');
        if (symbol) {
            color.style.backgroundImage = 'url(' + symbol + ')';
        }
        L.DomEvent.on(zoom_to, 'click', function () {
            this.bringToCenter();
            this.view({latlng: this.getCenter()});
        }, feature);
        return feature_li;
    },

    removeFeatures: function (datalayer) {
        var el = L.DomUtil.get('browse_data_datalayer_' + datalayer.storage_id);
        if (el) {
            el.innerHTML = '';
        }
    },


    newDataLayer: function (e) {
        var map = this._map,
            url = L.Util.template(map.options.urls.datalayer_add, {'map_id': map.options.storage_id});
        L.Storage.Xhr.get(url, {
            'callback': function (data) {
                var datalayer = map._createDataLayer({});
                return datalayer._handleEditResponse(data);
            }
        });
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
