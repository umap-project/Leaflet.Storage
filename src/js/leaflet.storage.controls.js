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

    // _showActionsToolbar: function () {
    //     var buttonIndex = this._activeMode.buttonIndex,
    //     lastButtonIndex = this._lastButtonIndex,
    //     buttonWidth = 46, // TODO: this should be calculated
    //     borderWidth = 1, // TODO: this should also be calculated
    //     toolbarPosition = (buttonIndex * buttonWidth) + (buttonIndex * borderWidth) + 10;

    //     // Correctly position the cancel button
    //     this._actionsContainer.style.left = toolbarPosition + 'px';

    //     if (buttonIndex === 0) {
    //         L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-notop');
    //         L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-top');
    //     }

    //     if (buttonIndex === lastButtonIndex) {
    //         L.DomUtil.addClass(this._toolbarContainer, 'leaflet-draw-toolbar-nobottom');
    //         L.DomUtil.addClass(this._actionsContainer, 'leaflet-draw-actions-bottom');
    //     }

    //     this._actionsContainer.style.display = 'block';
    // }

});


L.Storage.SettingsToolbar = L.Toolbar.extend({

    addToolbar: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-draw-section'),
        buttonIndex = 0,
        buttonClassPrefix = 'leaflet-draw-draw';
        this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
        var actions = map.getEditActions(), action;
        for (var i = 0; i < actions.length; i++) {
            action = actions[i];
            action.container = this._toolbarContainer;
            this._createButton(action);
        }

        container.appendChild(this._toolbarContainer);
        return container;
    }

});

L.Storage.EditControl = L.Control.extend({

    options: {
        position: 'topright'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-edit-enable storage-control'),
            edit = L.DomUtil.create('a', '', container);
        edit.href = '#';
        edit.title = L._("Enable editing") + ' (Ctrl-E)';

        L.DomEvent
            .addListener(edit, 'click', L.DomEvent.stop)
            .addListener(edit, 'click', map.enableEdit, map);
        return container;
    }

});

L.Storage.DrawControl = L.Control.Draw.extend({
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

    getDrawToolbar: function () {
        for (var toolbarId in this._toolbars) {
            if (this._toolbars[toolbarId] instanceof L.DrawToolbar) {
                return this._toolbars[toolbarId];
            }
        }
    },

    startMarker: function () {
        this.getDrawToolbar()._modes.marker.handler.enable();
    },

    startPolygon: function () {
        this.getDrawToolbar()._modes.polygon.handler.enable();
    },

    startPolyline: function () {
        this.getDrawToolbar()._modes.polyline.handler.enable();
    }

});


L.Draw.Marker.include({

    _fireCreatedEvent: function () {
        // Overriding to instanciate our own Marker class
        // How to do it in a cleaner way? Asking upstream to add a hook?
        var marker = new L.Storage.Marker(this._map, this._marker.getLatLng());
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
    }
});

L.Draw.Polyline.include({

    _fireCreatedEvent: function () {
        var poly = new L.Storage.Polyline(this._map, this._poly.getLatLngs());
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
    }

});

L.Draw.Polygon.include({

    _fireCreatedEvent: function () {
        var poly = new L.Storage.Polygon(this._map, this._poly.getLatLngs());
        L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
    }

});

/* Share control */
L.Control.Embed = L.Control.extend({

    options: {
        position: "topleft"
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-embed storage-control');

        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = L._("Embed and share this map");

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', map.renderShareBox, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.Storage.MoreControls = L.Control.extend({

    options: {
        position: "topleft"
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', ''),
            more = L.DomUtil.create('a', 'storage-control-more storage-control-text', container),
            less = L.DomUtil.create('a', 'storage-control-less storage-control-text', container);
        more.href = '#';
        more.title = L._("More controls");
        more.innerHTML = L._('More');

        L.DomEvent
            .on(more, 'click', L.DomEvent.stop)
            .on(more, 'click', this.toggle, this);

        less.href = '#';
        less.title = L._("Hide controls");
        less.innerHTML = L._('Less');

        L.DomEvent
            .on(less, 'click', L.DomEvent.stop)
            .on(less, 'click', this.toggle, this);

        return container;
    },

    toggle: function () {
        var pos = this.getPosition(),
            corner = this._map._controlCorners[pos],
            className = 'storage-more-controls';
        if (L.DomUtil.hasClass(corner, className)) {
            L.DomUtil.removeClass(corner, className);
        } else {
            L.DomUtil.addClass(corner, className);
        }
    }

});


L.Storage.DataLayersControl = L.Control.extend({

    options: {
        position: "topleft"
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-browse storage-control'),
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

        if (!L.Browser.touch) {
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'mousewheel', L.DomEvent.stopPropagation);
            L.DomEvent.on(container, 'MozMousePixelScroll', L.DomEvent.stopPropagation);
        } else {
            L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
        }
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
        if (datalayer.storage_id) {  // storage_id is null for non saved ones
            edit.id = 'edit_datalayer_' + datalayer.storage_id;
        }

        title.innerHTML = datalayer.options.name;
        L.DomEvent.on(toggle, 'click', function (e) { this.toggleDataLayer(datalayer); }, this);
        L.DomEvent.on(zoom_to, 'click', datalayer.zoomTo, datalayer);
        L.DomEvent.on(edit, 'click', datalayer.edit, datalayer);
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
                title.innerHTML = datalayer.options.name;
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
        title.innerHTML = feature.properties.name;
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
        var datalayer = this._map._createDataLayer({});
        datalayer.connectToMap();
        datalayer.edit();
    }

});

L.Storage.TileLayerControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-tilelayers storage-control');

        var link = L.DomUtil.create('a', "", container);
        link.href = '#';
        link.title = L._("Change map background");

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', this.openSwitcher, this)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    },

    openSwitcher: function (options) {
        var self = this;
        this._tilelayers_container = L.DomUtil.create('ul', 'storage-tilelayer-switcher-container');
        this.buildList(options);
    },

    buildList: function (options) {
        for (var i=0,l=this._map.tilelayers.length;i<l;i++) {
            this.addTileLayerElement(this._map.tilelayers[i], options);
        }
        L.Storage.fire("ui:start", {data: {html: this._tilelayers_container}});
    },

    addTileLayerElement: function (tilelayer, options) {
        var selectedClass = this._map.hasLayer(tilelayer) ? 'selected': '',
            el = L.DomUtil.create('li', selectedClass, this._tilelayers_container),
            img = L.DomUtil.create('img', '', el),
            name = L.DomUtil.create('div', '', el);
        img.src = L.Util.template(tilelayer.options.url_template, this._map.demoTileInfos);
        name.innerHTML = tilelayer.options.name;
        L.DomEvent.on(el, 'click', function (e) {
            this._map.selectTileLayer(tilelayer);
            L.S.fire('ui:end');
            if (options && options.callback) {
                options.callback(tilelayer);
            }
        }, this);
    }


});

L.Control.Attribution.prototype._updateOrig = L.Control.Attribution.prototype._update;
L.Control.Attribution.mergeOptions({
    prefix: ''
});
L.Control.Attribution.include({

    _update: function () {
        this._updateOrig();
        var link = L.DomUtil.create('a', '', this._container);
        link.innerHTML = ' — ' + L._('About');
        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', this._map.displayCaption, this._map)
            .on(link, 'dblclick', L.DomEvent.stop);
    }

});


L.Storage.HomeControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-home storage-control'),
            link = L.DomUtil.create('a', "", container);

        link.href = '/';
        link.title = L._("Go to home page");

        return container;
    }
});


L.Storage.LocateControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-locate storage-control'),
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


L.Storage.JumpToLocationControl = L.Control.extend({

    options: {
        position: 'topleft',
        server_url: 'http://open.mapquestapi.com/nominatim/v1/search.php'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-search storage-control'),
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


L.Control.MiniMap.include({

    initialize: function (layer, options) {
        L.Util.setOptions(this, options);
        this._layer = this._cloneLayer(layer);
    },

    onMainMapBaseLayerChange: function (e) {
        var layer = this._cloneLayer(e.layer);
        if (this._miniMap.hasLayer(this._layer)) {
            this._miniMap.removeLayer(this._layer);
        }
        this._layer = layer;
        this._miniMap.addLayer(this._layer);
    },

    _cloneLayer: function (layer) {
        return new L.TileLayer(layer._url, L.Util.extend({}, layer.options));
    }

});


L.Control.Loading.include({

    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'storage-loader', map._controlContainer);
        map.on('baselayerchange', this._layerAdd, this);
        this._addMapListeners(map);
        this._map = map;
    },

    _showIndicator: function () {
        L.DomUtil.addClass(this._map._container, 'storage-loading');
    },

    _hideIndicator: function() {
        L.DomUtil.removeClass(this._map._container, 'storage-loading');
    }

});


/*
* Make it dynamic
*/
L.S.ContextMenu = L.Map.ContextMenu.extend({

    _createItems: function (e) {
        this._map.setContextMenuItems(e);
        L.Map.ContextMenu.prototype._createItems.call(this);
    },

    _showAtPoint: function (pt, e) {
        this._items = [];
        this._container.innerHTML = "";
        this._createItems(e);
        L.Map.ContextMenu.prototype._showAtPoint.call(this, pt, e);
    }

});