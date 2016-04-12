L.Storage.BaseAction = L.ToolbarAction.extend({

    initialize: function (map) {
        this.map = map;
        this.options.toolbarIcon = {
            className: this.options.className,
            tooltip: this.options.tooltip
        };
        L.ToolbarAction.prototype.initialize.call(this);
        if (this.options.helpMenu && !this.map.helpMenuActions[this.options.className]) this.map.helpMenuActions[this.options.className] = this;
    }

});

L.Storage.ImportAction = L.Storage.BaseAction.extend({

    options: {
        helpMenu: true,
        className: 'upload-data',
        tooltip: L._('Import data') + ' (Ctrl+I)'
    },

    addHooks: function () {
        this.map.importPanel();
    }

});

L.Storage.EditPropertiesAction = L.Storage.BaseAction.extend({

    options: {
        helpMenu: true,
        className: 'update-map-settings',
        tooltip: L._('Edit map settings')
    },

    addHooks: function () {
        this.map.edit();
    }

});

L.Storage.ChangeTileLayerAction = L.Storage.BaseAction.extend({

    options: {
        helpMenu: true,
        className: 'update-map-tilelayers',
        tooltip: L._('Change tilelayers')
    },

    addHooks: function () {
        this.map.updateTileLayers();
    }

});

L.Storage.UpdateExtentAction = L.Storage.BaseAction.extend({

    options: {
        className: 'update-map-extent',
        tooltip: L._('Save this center and zoom')
    },

    addHooks: function () {
        this.map.updateExtent();
    }

});

L.Storage.UpdatePermsAction = L.Storage.BaseAction.extend({

    options: {
        className: 'update-map-permissions',
        tooltip: L._('Update permissions and editors')
    },

    addHooks: function () {
        this.map.updatePermissions();
    }

});

L.Storage.DrawMarkerAction = L.Storage.BaseAction.extend({

    options: {
        helpMenu: true,
        className: 'storage-draw-marker',
        tooltip: L._('Draw a marker')
    },

    addHooks: function () {
        this.map.startMarker();
    }

});

L.Storage.DrawPolylineAction = L.Storage.BaseAction.extend({

    options: {
        helpMenu: true,
        className: 'storage-draw-polyline',
        tooltip: L._('Draw a polyline')
    },

    addHooks: function () {
        this.map.startPolyline();
    }

});

L.Storage.DrawPolygonAction = L.Storage.BaseAction.extend({

    options: {
        helpMenu: true,
        className: 'storage-draw-polygon',
        tooltip: L._('Draw a polygon')
    },

    addHooks: function () {
        this.map.startPolygon();
    }

});

L.Storage.AddPolylineShapeAction = L.Storage.BaseAction.extend({

    options: {
        className: 'storage-draw-polyline-multi',
        tooltip: L._('Add a line to the current multi')
    },

    addHooks: function () {
        this.map.editedFeature.editor.newShape();
    }

});

L.Storage.AddPolygonShapeAction = L.S.AddPolylineShapeAction.extend({

    options: {
        className: 'storage-draw-polygon-multi',
        tooltip: L._('Add a polygon to the current multi')
    }

});

L.Storage.BaseFeatureAction = L.ToolbarAction.extend({

    initialize: function (map, feature, latlng) {
        this.map = map;
        this.feature = feature;
        this.latlng = latlng;
        L.ToolbarAction.prototype.initialize.call(this);
        this.postInit();
    },

    postInit: function () {},

    hideToolbar: function () {
        this.map.removeLayer(this.toolbar);
    },

    addHooks: function () {
        this.onClick({latlng: this.latlng});
        this.hideToolbar();
    }

});

L.Storage.CreateHoleAction = L.S.BaseFeatureAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-new-hole',
            tooltip: L._('Start a hole here')
        }
    },

    onClick: function (e) {
        this.feature.startHole(e);
    }

});

L.Storage.ToggleEditAction = L.S.BaseFeatureAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-toggle-edit',
            tooltip: L._('Toggle edit mode')
        }
    },

    onClick: function (e) {
        if (this.feature._toggleEditing) this.feature._toggleEditing(e);  // Path
        else this.feature.edit(e);  // Marker
    }

});

L.Storage.DeleteFeatureAction = L.S.BaseFeatureAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-delete-all',
            tooltip: L._('Delete this feature')
        }
    },

    postInit: function () {
        if (!this.feature.isMulti()) this.options.toolbarIcon.className = 'storage-delete-one-of-one';
    },

    onClick: function (e) {
        this.feature.confirmDelete(e);
    }

});

L.Storage.DeleteShapeAction = L.S.BaseFeatureAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-delete-one-of-multi',
            tooltip: L._('Delete this shape')
        }
    },

    onClick: function (e) {
        this.feature.enableEdit().deleteShapeAt(e.latlng);
    }

});

L.Storage.ExtractShapeFromMultiAction = L.S.BaseFeatureAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-extract-shape-from-multi',
            tooltip: L._('Extract shape to separate feature')
        }
    },

    onClick: function (e) {
        this.feature.isolateShape(e.latlng);
    }

});

L.Storage.BaseVertexAction = L.S.BaseFeatureAction.extend({

    initialize: function (map, feature, latlng, vertex) {
        this.vertex = vertex;
        L.S.BaseFeatureAction.prototype.initialize.call(this, map, feature, latlng);
    }

});

L.Storage.DeleteVertexAction = L.S.BaseVertexAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-delete-vertex',
            tooltip: L._('Delete this vertex')
        }
    },

    onClick: function () {
        this.vertex.delete();
    }

});

L.Storage.SplitLineAction = L.S.BaseVertexAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-split-line',
            tooltip: L._('Split line')
        }
    },

    onClick: function () {
        this.vertex.split();
    }

});

L.Storage.ContinueLineAction = L.S.BaseVertexAction.extend({

    options: {
        toolbarIcon: {
            className: 'storage-continue-line',
            tooltip: L._('Continue line')
        }
    },

    onClick: function () {
        this.vertex.continue();
    }

});

// Leaflet.Toolbar doesn't allow twice same toolbar class…
L.Storage.SettingsToolbar = L.Toolbar.Control.extend({});
L.Storage.DrawToolbar = L.Toolbar.Control.extend({

    initialize: function (options) {
        L.Toolbar.Control.prototype.initialize.call(this, options);
        this.map = this.options.map;
        this.map.on('seteditedfeature', this.redraw, this);
    },

    appendToContainer: function (container) {
        this.options.actions = [];
        if (this.map.options.enableMarkerDraw) {
            this.options.actions.push(L.S.DrawMarkerAction);
        }
        if (this.map.options.enablePolylineDraw) {
            this.options.actions.push(L.S.DrawPolylineAction);
            if (this.map.editedFeature && this.map.editedFeature instanceof L.S.Polyline) {
                this.options.actions.push(L.S.AddPolylineShapeAction);
            }
        }
        if (this.map.options.enablePolygonDraw) {
            this.options.actions.push(L.S.DrawPolygonAction);
            if (this.map.editedFeature && this.map.editedFeature instanceof L.S.Polygon) {
                this.options.actions.push(L.S.AddPolygonShapeAction);
            }
        }
        L.Toolbar.Control.prototype.appendToContainer.call(this, container);
    },

    redraw: function () {
        var container = this._control.getContainer();
        container.innerHTML = '';
        this.appendToContainer(container);
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
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', map.renderShareBox, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.Storage.MoreControls = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function () {
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
        var datalayerLi = L.DomUtil.create('li', '', this._datalayers_container);
        datalayer.renderToolbox(datalayerLi);
        var title = L.DomUtil.add('span', 'layer-title', datalayerLi, datalayer.options.name);

        datalayerLi.id = 'browse_data_toggle_' + datalayer.storage_id;
        L.DomUtil.classIf(datalayerLi, 'off', !datalayer.isVisible());

        title.innerHTML = datalayer.options.name;
    },

    newDataLayer: function () {
        var datalayer = this._map.createDataLayer({});
        datalayer.edit();
    }

});

L.Storage.DataLayer.include({

    renderToolbox: function (container) {
        var toggle = L.DomUtil.create('i', 'layer-toggle', container),
            zoomTo = L.DomUtil.create('i', 'layer-zoom_to', container),
            edit = L.DomUtil.create('i', 'layer-edit show-on-edit', container),
            table = L.DomUtil.create('i', 'layer-table-edit show-on-edit', container);
        zoomTo.title = L._('Zoom to layer extent');
        toggle.title = L._('Show/hide layer');
        edit.title = L._('Edit');
        table.title = L._('Edit properties in a table');
        L.DomEvent.on(toggle, 'click', this.toggle, this);
        L.DomEvent.on(zoomTo, 'click', this.zoomTo, this);
        L.DomEvent.on(edit, 'click', this.edit, this);
        L.DomEvent.on(table, 'click', this.tableEdit, this);
        L.DomUtil.addClass(container, this.getHidableClass());
        L.DomUtil.classIf(container, 'off', !this.isVisible());
    },

    getLocalId: function () {
        return this.storage_id || 'tmp' + L.Util.stamp(this);
    },

    getHidableElements: function () {
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
            featuresContainer = L.DomUtil.create('div', 'storage-browse-features', browserContainer),
            filterKeys = (this.options.filterKey || this.options.sortKey || 'name').split(',');
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
            L.DomUtil.add('span', '', headline, datalayer.options.name);
            var ul = L.DomUtil.create('ul', '', container);
            L.DomUtil.classIf(container, 'off', !datalayer.isVisible());

            var build = function () {
                ul.innerHTML = '';
                datalayer.eachFeature(function (feature) {
                    if (filterValue && !feature.matchFilter(filterValue, filterKeys)) return;
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
        var link = L.DomUtil.create('li', '');
        L.DomUtil.create('i', 'storage-icon-16 storage-caption', link);
        var label = L.DomUtil.create('span', '', link);
        label.innerHTML = label.title = L._('About');
        L.DomEvent.on(link, 'click', this.displayCaption, this);
        L.Storage.fire('ui:start', {data: {html: browserContainer}, actions: [link]});
    }

});



L.Storage.TileLayerControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function () {
        var container = L.DomUtil.create('div', 'leaflet-control-tilelayers storage-control');

        var link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = L._('Change map background');

        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', this.openSwitcher, this)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    },

    openSwitcher: function (options) {
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
        var selectedClass = this._map.hasLayer(tilelayer) ? 'selected' : '',
            el = L.DomUtil.create('li', selectedClass, this._tilelayers_container),
            img = L.DomUtil.create('img', '', el),
            name = L.DomUtil.create('div', '', el);
        img.src = L.Util.template(tilelayer.options.url_template, this._map.demoTileInfos);
        name.innerHTML = tilelayer.options.name;
        L.DomEvent.on(el, 'click', function () {
            this._map.selectTileLayer(tilelayer);
            L.S.fire('ui:end');
            if (options && options.callback) {
                options.callback(tilelayer);
            }
        }, this);
    }


});

L.S.AttributionControl = L.Control.Attribution.extend({

    options: {
        prefix: ''
    },

    _update: function () {
        L.Control.Attribution.prototype._update.call(this);
        if (this._map.options.shortCredit) {
            L.DomUtil.add('span', '', this._container, ' — ' + L.Util.toHTML(this._map.options.shortCredit));
        }
        var link = L.DomUtil.add('a', '', this._container, ' — ' + L._('About'));
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

    onAdd: function () {
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
        var fn = function () {
            map.locate({
                setView: true,
                enableHighAccuracy: true
            });
        };

        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});


L.Storage.JumpToLocationControl = L.Control.extend({

    options: {
        position: 'topleft',
        server_url: 'https://open.mapquestapi.com/nominatim/v1/search.php'
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
            var searchTerms = input.value;
            if (!searchTerms) {
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
                key: map.options.mapquest_key,
                format: 'json',
                q: searchTerms,
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
                        L.S.fire('ui:alert', {content: L._('Sorry, no location found for {location}', {location: searchTerms})});
                    }
                }
            });
        };

        L.DomEvent
            .on(form, 'submit', L.DomEvent.stop)
            .on(form, 'submit', fn);
        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
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

L.S.IframeExporter = L.Class.extend({
    includes: [L.Mixin.Events],

    options: {
        includeFullScreenLink: true,
        currentView: false,
        keepCurrentDatalayers: false
    },

    queryString: {
        scaleControl: false,
        miniMap: false,
        scrollWheelZoom: false,
        zoomControl: true,
        allowEdit: false,
        moreControl: true,
        datalayersControl: true,
        onLoadPanel: 'none',
        captionBar: false
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
        var datalayers = [];
        if (this.options.keepCurrentDatalayers) {
            this.map.eachDataLayer(function (datalayer) {
                if (datalayer.isVisible() && datalayer.storage_id) {
                    datalayers.push(datalayer.storage_id);
                }
            });
            this.queryString.datalayers = datalayers.join(',');
        } else {
            delete this.queryString.datalayers;
        }
        var currentView = this.options.currentView ? window.location.hash : '',
            iframeUrl = this.baseUrl + '?' + L.S.Xhr.buildQueryString(this.queryString) + currentView,
            code = '<iframe width="' + this.dimensions.width + '" height="' + this.dimensions.height + '" frameBorder="0" src="' + iframeUrl + '"></iframe>';
        if (this.options.includeFullScreenLink) {
            code += '<p><a href="' + this.baseUrl + '">' + L._('See full screen') + '</a></p>';
        }
        return code;
    }

});

L.S.Editable = L.Editable.extend({

    initialize: function (map, options) {
        L.Editable.prototype.initialize.call(this, map, options);
        this.on('editable:drawing:start editable:drawing:click', this.drawingTooltip);
        this.on('editable:drawing:end', this.closeTooltip);
        // Layer for items added by users
        this.on('editable:drawing:cancel', function (e) {
            if (e.layer._latlngs && e.layer._latlngs.length < e.layer.editor.MIN_VERTEX) e.layer.del();
            if (e.layer instanceof L.S.Marker) e.layer.del();
        });
        this.on('editable:drawing:commit', function (e) {
            e.layer.isDirty = true;
            if (this.map.editedFeature !== e.layer) e.layer.edit(e);
        });
        this.on('editable:editing', function (e) {
            e.layer.isDirty = true;
        });
        this.on('editable:vertex:ctrlclick', function (e) {
            var index = e.vertex.getIndex();
            if (index === 0 || index === e.vertex.getLastIndex() && e.vertex.continue) e.vertex.continue();
        });
        this.on('editable:vertex:rawclick', this.onVertexRawClick);
    },

    createPolyline: function (latlngs) {
        return new L.Storage.Polyline(this.map, latlngs);
    },

    createPolygon: function (latlngs) {
        var polygon = new L.Storage.Polygon(this.map, latlngs);
        return polygon;
    },

    createMarker: function (latlng) {
        return new L.Storage.Marker(this.map, latlng);
    },

    connectCreatedToMap: function (layer) {
        // Overrided from Leaflet.Editable
        var datalayer = this.map.defaultDataLayer();
        datalayer.addLayer(layer);
        layer.isDirty = true;
        return layer;
    },

    drawingTooltip: function (e) {
        var content;
        if (e.layer instanceof L.Marker) content = L._('Click to add a marker');
        else if (e.layer instanceof L.Polyline) {
            if (!e.layer.editor._drawnLatLngs.length) {
                if (e.layer instanceof L.Polygon) content = L._('Click to start drawing a polygon');
                else if (e.layer instanceof L.Polyline) content = L._('Click to start drawing a line');
            } else if (e.layer.editor._drawnLatLngs.length < e.layer.editor.MIN_VERTEX) {
                content = L._('Click to continue drawing');
            } else {
                content = L._('Click last point to finish shape');
            }
        }
        if (content) L.S.fire('ui:tooltip', {content: content});
    },

    closeTooltip: function () {
        L.S.fire('ui:tooltip:abort');
    },

    onVertexRawClick: function (e) {
        e.layer.onVertexRawClick(e);
        L.DomEvent.stop(e);
        e.cancel();
    }

});
