/*
* Hack for handling a custom tooltip on buttons over.
*/
L.Toolbar.prototype._createButtonOrig = L.Toolbar.prototype._createButton;

L.Toolbar.include({

    _createButton: function (options) {
        var title = options.title;
        options.title = '';  // We don't want our tooltip AND default HTML one
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
        edit.title = L._('Enable editing') + ' (Ctrl-E)';

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

L.S.PolyEdit = L.Edit.Poly.extend({

    _createMarker: function (latlng, index) {
        var marker = L.Edit.Poly.prototype._createMarker.call(this, latlng, index);
        marker._poly = this._poly;
        marker.on('contextmenu', this._onMarkerContextMenu);
        return marker;
    },

    _removeMarker: function (marker) {
        marker.off('contextmenu', this._onMarkerContextMenu);
        L.Edit.Poly.prototype._removeMarker.call(this, marker);
    },

    _onMarkerContextMenu: function (e) {
        e._polyHandlerIndex = this._index;
        this._poly.fire('contextmenu', e);
    }

});

/* Share control */
L.Control.Embed = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-embed storage-control');

        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = L._('Embed and share this map');

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
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', ''),
            more = L.DomUtil.create('a', 'storage-control-more storage-control-text', container),
            less = L.DomUtil.create('a', 'storage-control-less storage-control-text', container);
        more.href = '#';
        more.title = L._('More controls');
        more.innerHTML = L._('More');

        L.DomEvent
            .on(more, 'click', L.DomEvent.stop)
            .on(more, 'click', this.toggle, this);

        less.href = '#';
        less.title = L._('Hide controls');
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
        position: 'topleft'
    },

    labels: {
        zoomToLayer: L._('Zoom to layer extent'),
        toggleLayer: L._('Show/hide layer'),
        editLayer: L._('Edit')
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-browse storage-control'),
            actions = L.DomUtil.create('div', 'storage-browse-actions', container);
        this._datalayers_container = L.DomUtil.create('ul', 'storage-browse-datalayers', actions);

        var link = L.DomUtil.create('a', 'storage-browse-link', actions);
        link.href = '#';
        link.title = link.innerHTML = L._('Browse data');

        var add = L.DomUtil.create('a', 'show-on-edit block add-datalayer', actions);
        add.href = '#';
        add.innerHTML = add.title = L._('Add a layer');

        var toggle = L.DomUtil.create('a', 'storage-browse-toggle', container);
        toggle.href = '#';

        L.DomEvent
            .on(toggle, 'click', L.DomEvent.stop);

        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', map.openBrowser, map);

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

    addDataLayer: function (datalayer) {
        var datalayer_li = L.DomUtil.create('li', '', this._datalayers_container);
        datalayer.renderToolbox(datalayer_li);
        var title = L.DomUtil.add('span', 'layer-title', datalayer_li, datalayer.options.name);

        datalayer_li.id = 'browse_data_toggle_' + datalayer.storage_id;
        L.DomUtil.classIf(datalayer_li, 'off', !datalayer.isVisible());

        title.innerHTML = datalayer.options.name;
    },

    newDataLayer: function () {
        var datalayer = this._map._createDataLayer({});
        datalayer.edit();
    }

});

L.Storage.DataLayer.include({

    renderToolbox: function (container) {
        var toggle = L.DomUtil.create('i', 'layer-toggle', container),
            zoom_to = L.DomUtil.create('i', 'layer-zoom_to', container),
            edit = L.DomUtil.create('i', 'layer-edit show-on-edit', container),
            table = L.DomUtil.create('i', 'layer-table-edit show-on-edit', container);
        zoom_to.title = L._('Zoom to layer extent');
        toggle.title = L._('Show/hide layer');
        edit.title = L._('Edit');
        table.title = L._('Edit properties in a table');
        L.DomEvent.on(toggle, 'click', this.toggle, this);
        L.DomEvent.on(zoom_to, 'click', this.zoomTo, this);
        L.DomEvent.on(edit, 'click', this.edit, this);
        L.DomEvent.on(table, 'click', this.tableEdit, this);
        L.DomUtil.addClass(container, this.getHidableClass());
        L.DomUtil.classIf(container, 'off', !this.isVisible());
    },

    getLocalId: function () {
        return this.storage_id || 'tmp' + L.Util.stamp(this);
    },

    getHidableElements: function () {
        return document.querySelectorAll('.' + this.getHidableClass());
    },

    getHidableClass: function () {
        return 'show_with_datalayer_' + this.getLocalId();
    },

    propagateRemote: function () {
        var els = this.getHidableElements();
        for (var i = 0; i < els.length; i++) {
            L.DomUtil.classIf(els[i], 'remotelayer', this.isRemoteLayer());
        }
    },

    propagateHide: function () {
        var els = this.getHidableElements();
        for (var i = 0; i < els.length; i++) {
            L.DomUtil.addClass(els[i], 'off');
        }
    },

    propagateShow: function () {
        this.onceLoaded(function () {
            var els = this.getHidableElements();
            for (var i = 0; i < els.length; i++) {
                L.DomUtil.removeClass(els[i], 'off');
            }
        }, this);
    }

});

L.Storage.DataLayer.addInitHook(function () {
    this.on('hide', this.propagateHide);
    this.on('show', this.propagateShow);
    this.propagateShow();
});


L.Storage.Map.include({

    _openBrowser: function () {
        var browserContainer = L.DomUtil.create('div', 'storage-browse-data'),
            title = L.DomUtil.add('h3', 'storage-browse-title', browserContainer, this.options.name),
            filter = L.DomUtil.create('input', '', browserContainer),
            filterValue = '',
            featuresContainer = L.DomUtil.create('div', 'storage-browse-features', browserContainer);
        filter.type = 'text';
        filter.placeholder = L._('Filter…');

        var addFeature = function (feature) {
            var feature_li = L.DomUtil.create('li', feature.getClassName() + ' feature'),
                zoom_to = L.DomUtil.create('i', 'feature-zoom_to', feature_li),
                edit = L.DomUtil.create('i', 'show-on-edit feature-edit', feature_li),
                color = L.DomUtil.create('i', 'feature-color', feature_li),
                title = L.DomUtil.create('span', 'feature-title', feature_li),
                symbol = feature._getIconUrl ? L.S.Icon.prototype.formatUrl(feature._getIconUrl(), feature): null;
            zoom_to.title = L._('Bring feature to center');
            edit.title = L._('Edit this feature');
            title.innerHTML = feature.getDisplayName() || '—';
            color.style.backgroundColor = feature.getOption('color');
            if (symbol) {
                color.style.backgroundImage = 'url(' + symbol + ')';
            }
            L.DomEvent.on(zoom_to, 'click', function (e) {
                this.bringToCenter(e, L.bind(this.view, this));
            }, feature);
            L.DomEvent.on(edit, 'click', function () {
                this.edit();
            }, feature);
            return feature_li;
        };

        var append = function (datalayer) {
            var container = L.DomUtil.create('div', datalayer.getHidableClass(), featuresContainer),
                headline = L.DomUtil.create('h5', '', container);
            container.id = 'browse_data_datalayer_' + datalayer.storage_id;
            datalayer.renderToolbox(headline);
            var title = L.DomUtil.add('span', '', headline, datalayer.options.name),
                ul = L.DomUtil.create('ul', '', container);
            L.DomUtil.classIf(container, 'off', !datalayer.isVisible());

            var build = function () {
                ul.innerHTML = '';
                datalayer.eachFeature(function (feature) {
                    if (filterValue && (feature.getDisplayName() || '').toLowerCase().indexOf(filterValue) === -1) return;
                    ul.appendChild(addFeature(feature));
                });
            };
            build();
            datalayer.on('datachanged', build);
            L.Storage.once('ui:end', function () {
                datalayer.off('datachanged', build);
            });
            L.Storage.once('ui:ready', function () {
                L.Storage.once('ui:start', function () {
                    datalayer.off('datachanged', build);
                });
            });
        };

        var appendAll = function () {
            featuresContainer.innerHTML = '';
            filterValue = filter.value;
            this.eachDataLayer(function (datalayer) {
                append(datalayer);
            });
        };
        L.bind(appendAll, this)();
        L.DomEvent.on(filter, 'input', appendAll, this);
        L.Storage.fire('ui:start', {data: {html: browserContainer}});
    }

});



L.Storage.TileLayerControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-tilelayers storage-control');

        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = L._('Change map background');

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
        this._map.eachTileLayer(function (tilelayer) {
            this.addTileLayerElement(tilelayer, options);
        }, this);
        L.Storage.fire('ui:start', {data: {html: this._tilelayers_container}});
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
            link = L.DomUtil.create('a', '', container);

        link.href = '/';
        link.title = L._('Go to home page');

        return container;
    }
});


L.Storage.LocateControl = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-locate storage-control'),
            link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = L._('Center map on your location');
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
        var link = L.DomUtil.create('a', '', container);
        var form = L.DomUtil.create('form', '', container);
        var input = L.DomUtil.create('input', '', form);
        link.href = '#';
        link.title = input.placeholder = L._('Jump to location');
        link.innerHTML = '&nbsp;';
        var fn = function () {
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
            url = self.options.server_url + '?' + L.S.Xhr.buildQueryString(params);
            L.Storage.Xhr.get(url, {
                callback: function (data) {
                    L.DomUtil.removeClass(link, 'loading');
                    if (data.length > 0 && data[0].lon && data[0].lat) {
                        map.panTo([data[0].lat, data[0].lon]);
                        map.setZoom(map.getOption('zoomTo'));
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
        this._container.innerHTML = '';
        this._createItems(e);
        L.Map.ContextMenu.prototype._showAtPoint.call(this, pt, e);
    }

});

L.Control.MeasureControl.TITLE = L._('Measure distances');
L.S.MeasureControl = L.Control.MeasureControl.extend({

    onAdd: function (map) {
        L.Control.MeasureControl.prototype.onAdd.call(this, map);
        L.DomUtil.removeClass(this._container, 'leaflet-bar');
        L.DomUtil.addClass(this._container, 'storage-measure-control storage-control');
        if (map._controls.draw) {
            map._controls.draw.getDrawToolbar().on('enable', this.handler.disable, this.handler);
        }
        return this._container;
    }

});

L.S.IframeExporter = L.Class.extend({
    includes: [L.Mixin.Events],

    options: {
        includeFullScreenLink: true,
        currentView: false
    },

    queryString : {
        scaleControl: false,
        miniMap: false,
        scrollWheelZoom: false,
        zoomControl: true,
        allowEdit: false,
        moreControl: true,
        datalayersControl: true,
        onLoadPanel: 'none'
    },

    dimensions: {
        width: '100%',
        height: '300px'
    },

    initialize: function (map) {
        this.map = map;
        this.baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        // Use map default, not generic default
        this.queryString.onLoadPanel = this.map.options.onLoadPanel;
    },

    getMap: function () {
        return this.map;
    },

    build: function () {
        var currentView = this.options.currentView ? window.location.hash : '',
            iframeUrl = this.baseUrl + '?' + L.S.Xhr.buildQueryString(this.queryString) + currentView,
            code = '<iframe width="' + this.dimensions.width + '" height="' + this.dimensions.height + '" frameBorder="0" src="' + iframeUrl +'"></iframe>';
        if (this.options.includeFullScreenLink) {
            code += '<p><a href="' + this.baseUrl + '">' + L._('See full screen') + '</a></p>';
        }
        return code;
    }

});
