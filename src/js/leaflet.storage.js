L.Map.mergeOptions({
    base_layers: null,
    overlay_layers: null,
    datalayers: [],
    center: [4, 50],
    zoom: 6,
    hash: true,
    embedControl: true,
    datalayersControl: true,
    default_color: "DarkBlue",
    default_smoothFactor: 1.0,
    default_opacity: 0.5,
    default_fillOpacity: 0.3,
    default_stroke: true,
    default_fill: true,
    default_weight: 3,
    default_iconClass: "Default",
    attributionControl: true,
    allowEdit: true,
    homeControl: true,
    zoomControl: true,
    locateControl: true,
    jumpToLocationControl: true,
    editInOSMControl: false,
    editInOSMControlOptions: false,
    scaleControl: true,
    miniMap: false,
    displayCaptionOnLoad: false,
    name: '',
    description: '',
    displayPopupFooter: false,
    displayDataBrowserOnLoad: false,
    demoTileInfos: {s:'a', z:9, x:265, y:181},
    tilelayersControl: true,
    licences: [],
    licence: '',
    enableMarkerDraw: true,
    enablePolygonDraw: true,
    enablePolylineDraw: true,
    importPresets: [
        // {url: 'http://localhost:8019/en/datalayer/1502/', label: 'Simplified World Countries', format: 'geojson'}
    ]
});

L.Storage.Map.include({

    initialize: function (/* DOM element or id*/ el, /* Object*/ geojson) {
        // We manage it, so don't use Leaflet default behaviour
        if (geojson.properties && geojson.properties.locale) {
            L.setLocale(geojson.properties.locale);
        }
        var zoomControl = typeof geojson.properties.zoomControl !== "undefined" ? geojson.properties.zoomControl : true;
        geojson.properties.zoomControl = false;
        L.Map.prototype.initialize.call(this, el, geojson.properties);
        this.initLoader();
        this.name = this.options.name;
        this.description = this.options.description;
        this.demoTileInfos = this.options.demoTileInfos;
        if (geojson.geometry) {
            this.options.center = geojson.geometry;
        }
        if (typeof this.options.moreControl === "undefined") {
            this.options.moreControl = true;
        }
        this.options.zoomControl = zoomControl;
        this.overrideBooleanOptionFromQueryString("zoomControl");
        this.overrideBooleanOptionFromQueryString("moreControl");
        this.overrideBooleanOptionFromQueryString("miniMap");
        this.overrideBooleanOptionFromQueryString("scrollWheelZoom");
        this.overrideBooleanOptionFromQueryString("scaleControl");
        this.overrideBooleanOptionFromQueryString("allowEdit");
        this.overrideBooleanOptionFromQueryString("datalayersControl");
        if (L.Browser.ielt9) {
            // TODO include ie9
            this.options.allowEdit = false;
        }

        var editedFeature = null;
        try {
            Object.defineProperty(this, 'editedFeature', {
                get: function () {
                    return editedFeature;
                },
                set: function (feature) {
                    if (editedFeature && editedFeature != feature) {
                        editedFeature.endEdit();
                    }
                    editedFeature = feature;
                }
            });
        }
        catch (e) {
            // Certainly IE8, which has a limited version of defineProperty
        }

        if (this.options.hash) {
            this.addHash();
        }
        this.initCenter();

        this.initTileLayers(this.options.tilelayers);
        this.initControls();

        // Global storage for retrieving datalayers
        this.datalayers = {};
        this.datalayers_index = Array();
        this.deleted_datalayers = Array();
        // create datalayers
        for(var j in this.options.datalayers) {
            if(this.options.datalayers.hasOwnProperty(j)){
                this._createDataLayer(this.options.datalayers[j]);
            }
        }
        if (this.options.displayCaptionOnLoad) {
            this.displayCaption();
        }
        else if (this.options.displayDataBrowserOnLoad && this.options.datalayersControl) {
            this.openBrowser();
        }

        L.Storage.on('ui:closed', function () {
            this.invalidateSize({pan: false});
        }, this);

        var isDirty = false, // global status
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
                    if (status) {
                        L.DomUtil.addClass(this._container, "storage-is-dirty");
                    } else {
                        L.DomUtil.removeClass(this._container, "storage-is-dirty");
                    }
                    isDirty = status;
                }
            });
        }
        catch (e) {
            // Certainly IE8, which has a limited version of defineProperty
        }
        this.on('baselayerchange', function (e) {
            if (this._controls.miniMap) {
                this._controls.miniMap.onMainMapBaseLayerChange(e);
            }
        }, this);

        // Creation mode
        if (!this.options.storage_id) {
            this.isDirty = true;
            this.options.name = L._('Untitled map');
            this.options.allowEdit = true;
            var datalayer = this._createDataLayer({name: L._('Layer 1')});
            datalayer.connectToMap();
            this.enableEdit();
        }

        this.help = new L.Storage.Help(this);
        if (this.options.allowEdit) {
            // Layer for items added by users
            this.on('draw:created', function (e) {
                var datalayer = this.defaultDataLayer();
                datalayer.addLayer(e.layer);
                if (e.layerType == L.Draw.Polyline.TYPE || e.layerType == L.Draw.Polygon.TYPE) {
                    e.layer.editing.enable();
                    if (!e.latlng) {
                        e.latlng = e.layer._latlngs[e.layer._latlngs.length-1];
                    }
                }
                e.layer.isDirty = true;
                e.layer.edit(e);
            }, this);
            this.on('draw:edited', function (e) {
                e.layer.isDirty = true;
            });
            this.on('draw:start', function (e) {
                e.layer.isDirty = true;
            });
            L.Storage.on('ui:end', function (e) {
                this.editedFeature = null;
            }, this);
            this.initEditBar();
            var editShortcuts = function (e) {
                var key = e.keyCode,
                chars = {
                    E: 69,
                    H: 72,
                    I: 73,
                    L: 76,
                    M: 77,
                    P: 80,
                    S: 83
                };
                if (key == chars.E && e.ctrlKey && !this.editEnabled) {
                    L.DomEvent.stop(e);
                    this.enableEdit();
                } else if (key == chars.E && e.ctrlKey && this.editEnabled && !this.isDirty) {
                    L.DomEvent.stop(e);
                    this.disableEdit();
                    L.S.fire('ui:end');
                }
                if (key == chars.S && e.ctrlKey && this.isDirty) {
                    L.DomEvent.stop(e);
                    this.save();
                }
                if (key == chars.M && e.ctrlKey && this.editEnabled) {
                    L.DomEvent.stop(e);
                    this._controls.draw.startMarker();
                }
                if (key == chars.P && e.ctrlKey && this.editEnabled) {
                    L.DomEvent.stop(e);
                    this._controls.draw.startPolygon();
                }
                if (key == chars.L && e.ctrlKey && this.editEnabled) {
                    L.DomEvent.stop(e);
                    this._controls.draw.startPolyline();
                }
                if (key == chars.I && e.ctrlKey && this.editEnabled) {
                    L.DomEvent.stop(e);
                    this.importPanel();
                }
                if (key == chars.H && e.ctrlKey && this.editEnabled) {
                    L.DomEvent.stop(e);
                    this.help.show('edit');
                }
            };
            L.DomEvent.addListener(document, 'keydown', editShortcuts, this);
        }

        window.onbeforeunload = function (e) {
            if (isDirty) {
                return true;
            }
        };
        this.backupOptions();
        this.initContextMenu();
    },

    overrideBooleanOptionFromQueryString: function (name) {
        L.Util.setBooleanFromQueryString(this.options, name);
    },

    initControls: function () {
        this._controls = this._controls || {};
        for (var i in this._controls) {
            this.removeControl(this._controls[i]);
            delete this._controls[i];
        }

        if (this.options.zoomControl) {
            this._controls.zoomControl = (new L.Control.Zoom()).addTo(this);
        }
        if (this.options.datalayersControl) {
            this._controls.datalayersControl = new L.Storage.DataLayersControl().addTo(this);
        }
        if (this.options.allowEdit) {
            this._controls.toggleEdit = new L.Storage.EditControl(this);
            this.addControl(this._controls.toggleEdit);
            var options = this.options.editOptions ? this.options.editOptions : {};
            this._controls.draw = new L.Storage.DrawControl(this, options);
            this.addControl(this._controls.draw);
        }
        if (this.options.moreControl) {
            this._controls.moreControl = (new L.Storage.MoreControls()).addTo(this);
            this._controls.homeControl = (new L.Storage.HomeControl()).addTo(this);
            this._controls.locateControl = (new L.Storage.LocateControl()).addTo(this);
            this._controls.jumpToLocationControl = (new L.Storage.JumpToLocationControl()).addTo(this);
            this._controls.embedControl = (new L.Control.Embed(this, this.options.embedOptions)).addTo(this);
            this._controls.tilelayersControl = new L.Storage.TileLayerControl().addTo(this);
            this._controls.editInOSMControl = (new L.Control.EditInOSM({position: 'topleft'})).addTo(this);
            var measureOptions = {
                handler: {
                    icon: new L.DivIcon({
                        iconSize: new L.Point(8, 8),
                        className: 'leaflet-div-icon leaflet-editing-icon storage-measure-edge'
                    }),
                    shapeOptions: {
                        stroke: true,
                        color: 'darkslategray',
                        weight: 3,
                        opacity: 0.5,
                        fill: false,
                        clickable: false
                    }
                }
            };
            this._controls.measureControl = (new L.S.MeasureControl(measureOptions).addTo(this));
        }
        if (this.options.scaleControl) {
            this._controls.scaleControl = L.control.scale().addTo(this);
        }
        if (this.options.miniMap) {
            this.whenReady(function () {
                if (this.selected_tilelayer) {
                    this._controls.miniMap = new L.Control.MiniMap(this.selected_tilelayer).addTo(this);
                    this._controls.miniMap._miniMap.invalidateSize();
                }
            });
        }

    },

    updateDatalayersControl: function () {
        if (this._controls.datalayersControl) {
            this._controls.datalayersControl.update();
        }
    },

    backupOptions: function () {
        this._backupOptions = L.extend({}, this.options);
        this._backupOptions.tilelayer = L.extend({}, this.options.tilelayer);
    },

    resetOptions: function () {
        this.options = L.extend({}, this._backupOptions);
        this.options.tilelayer = L.extend({}, this._backupOptions.tilelayer);
    },

    initTileLayers: function () {
        this.tilelayers = Array();
        for(var i in this.options.tilelayers) {
            if(this.options.tilelayers.hasOwnProperty(i)) {
                this.tilelayers.push(this.createTileLayer(this.options.tilelayers[i]));
                if (this.options.tilelayer && this.options.tilelayer.url_template === this.options.tilelayers[i].url_template) {
                    // Keep control over the displayed attribution for non custom tilelayers
                    this.options.tilelayer.attribution = this.options.tilelayers[i].attribution;
                }
            }
        }
        if (this.options.tilelayer && this.options.tilelayer.url_template && this.options.tilelayer.attribution) {
            this.customTilelayer = this.createTileLayer(this.options.tilelayer);
            this.selectTileLayer(this.customTilelayer);
        } else {
            this.selectTileLayer(this.tilelayers[0]);
        }
    },

    createTileLayer: function (tilelayer) {
        return new L.TileLayer(tilelayer.url_template, tilelayer);
    },

    selectTileLayer: function (tilelayer) {
        if (tilelayer === this.selected_tilelayer) { return; }
        try {
            this.fire('baselayerchange', {layer: tilelayer});
            this.addLayer(tilelayer);
            if (this.selected_tilelayer) {
                this.removeLayer(this.selected_tilelayer);
            }
            this.selected_tilelayer = tilelayer;
            if (!isNaN(this.selected_tilelayer.options.minZoom) && this.getZoom() < this.selected_tilelayer.options.minZoom) {
                this.setZoom(this.selected_tilelayer.options.minZoom);
            }
            if (!isNaN(this.selected_tilelayer.options.maxZoom) && this.getZoom() > this.selected_tilelayer.options.maxZoom) {
                this.setZoom(this.selected_tilelayer.options.maxZoom);
            }
        } catch (e) {
            console.log(e.message, e.name);
            this.removeLayer(tilelayer);
            L.S.fire('ui:alert', {content: L._('Error in the tilelayer URL') + ': ' + tilelayer._url, level: 'error'});
            // Users can put tilelayer URLs by hand, and if they add wrong {variable},
            // Leaflet throw an error, and then the map is no more editable
        }
    },

    eachTileLayer: function (method, context) {
        var urls = [];
        for (var i in this.tilelayers) {
            if (this.tilelayers.hasOwnProperty(i)) {
                method.call(context, this.tilelayers[i]);
                urls.push(this.tilelayers[i]._url);
            }
        }
        if (this.customTilelayer && (Array.prototype.indexOf && urls.indexOf(this.customTilelayer._url) === -1)) {
            method.call(context || this, this.customTilelayer);
        }
    },

    initCenter: function () {
        if (this.options.hash && this._hash.parseHash(location.hash)) {
            // FIXME An invalid hash will cause the load to fail
            this._hash.update();
        }
        else if(this.options.locate && this.options.locate.setView) {
            // Prevent from making two setViews at init
            // which is not very fluid...
            this.locate(this.options.locate);
        }
        else {
            this.options.center = this.latLng(this.options.center);
            this.setView(this.options.center, this.options.zoom);
        }
    },

    latLng: function(a, b, c) {
        // manage geojson case and call original method
        if (!(a instanceof L.LatLng) && a.coordinates) {
            // Guess it's a geojson
            a = Array(a.coordinates[1], a.coordinates[0]);
        }
        return L.latLng(a, b, c);
    },

    _createDataLayer: function(datalayer) {
        return new L.Storage.DataLayer(this, datalayer);
    },

    getDefaultOption: function (option) {
        return this.options["default_" + option] || null;
    },

    updateExtent: function() {
        this.options.center = this.getCenter();
        this.options.zoom = this.getZoom();
        this.isDirty = true;
        L.Storage.fire("ui:alert", {content: L._('The zoom and center have been setted.'), "level": "info"});
    },

    updateTileLayers: function () {
        var self = this,
            callback = function (tilelayer) {
                self.options.tilelayer = tilelayer.toJSON();
                self.isDirty = true;
            };
        if (this._controls.tilelayersControl) {
            this._controls.tilelayersControl.openSwitcher({callback: callback});
        }
    },

    renderShareBox: function () {
        var container = L.DomUtil.create('div', 'storage-share'),
            embedTitle = L.DomUtil.add('h4', '', container, L._('Embed the map')),
            iframe = L.DomUtil.create('textarea', 'storage-share-iframe', container),
            url = window.location.protocol + '//' + window.location.host + window.location.pathname,
            iframeUrl = url + '?scaleControl=0&miniMap=0&scrollWheelZoom=0&allowEdit=0';
        iframe.innerHTML = '<iframe width="100%" height="300" frameBorder="0" src="' + iframeUrl +'"></iframe><p><a href="' + url + '">See full screen</a></p>';
        if (this.options.shortUrl) {
            L.DomUtil.add('h4', '', container, L._('Short URL'));
            var shortUrl = L.DomUtil.create('input', 'storage-short-url', container);
            shortUrl.type = "text";
            shortUrl.value = this.options.shortUrl;
        }
        L.DomUtil.add('h4', '', container, L._('Download raw data (GeoJSON)'));
        var download = L.DomUtil.create('a', 'button', container);
        var features = [];
        this.eachDataLayer(function (datalayer) {
            features = features.concat(datalayer.featuresToGeoJSON());
        });
        var geojson = {
            type: "FeatureCollection",
            features: features
        };
        var content = JSON.stringify(geojson, null, 2);
        window.URL = window.URL || window.webkitURL;
        var blob = new Blob([content], {type: 'application/json'});
        download.href = window.URL.createObjectURL(blob);
        download.innerHTML = L._('Download data');
        download.download = "features.geojson";
        L.S.fire('ui:start', {data:{html:container}});
    },

    updatePermissions: function () {
        if (!this.options.storage_id) {
            L.S.fire('ui:alert', {content: L._('Please save the map before'), level: 'info'});
            return;
        }
        var url = L.Util.template(this.options.urls.map_update_permissions, {'map_id': this.options.storage_id});
        this.get(url, {
            'listen_form': {'id': 'map_edit'}
        });
    },

    importPanel: function () {
        var container = L.DomUtil.create('div', 'storage-upload'),
            title = L.DomUtil.create('h4', '', container),
            presetBox = L.DomUtil.create('div', 'formbox', container),
            presetSelect = L.DomUtil.create('select', '', presetBox),
            fileBox = L.DomUtil.create('div', 'formbox', container),
            fileInput = L.DomUtil.create('input', '', fileBox),
            urlInput = L.DomUtil.create('input', '', container),
            rawInput = L.DomUtil.create('textarea', '', container),
            typeLabel = L.DomUtil.create('label', '', container),
            layerLabel = L.DomUtil.create('label', '', container),
            submitInput = L.DomUtil.create('input', '', container),
            map = this, option,
            types = ['geojson', 'csv', 'gpx', 'kml', 'osm'];
        title.innerHTML = L._('Import data');
        fileInput.type = "file";
        submitInput.type = "button";
        submitInput.value = L._('Import');
        submitInput.className = "button";
        typeLabel.innerHTML = L._('Choose the format of the data to import');
        this.help.button(typeLabel, 'importFormats');
        var typeInput = L.DomUtil.create('select', '', typeLabel);
        typeInput.name = "format";
        layerLabel.innerHTML = L._('Choose the layer to import in');
        var layerInput = L.DomUtil.create('select', '', layerLabel);
        layerInput.name = "datalayer";
        urlInput.type = "text";
        urlInput.placeholder = L._('Provide an URL here');
        rawInput.placeholder = L._('Paste here your data');
        this.eachDataLayer(function (datalayer) {
            var id = L.stamp(datalayer);
            option = L.DomUtil.create('option', '', layerInput);
            option.value = id;
            option.innerHTML = datalayer.options.name;
        });
        for (var i = 0; i < types.length; i++) {
            option = L.DomUtil.create('option', '', typeInput);
            option.value = option.innerHTML = types[i];
        }
        if (this.options.importPresets.length) {
            var noPreset = L.DomUtil.create('option', '', presetSelect);
            noPreset.value = noPreset.innerHTML = L._('Choose a preset');
            for (var j = 0; j < this.options.importPresets.length; j++) {
                option = L.DomUtil.create('option', '', presetSelect);
                option.value = this.options.importPresets[j].url;
                option.innerHTML = this.options.importPresets[j].label;
            }
        } else {
            presetBox.style.display = 'none';
        }

        var processContent = function (raw) {
            var type = typeInput.value,
                layerId = layerInput[layerInput.selectedIndex].value;
            layer = map.datalayers[layerId];
            layer.addRawData(raw, type);
            layer.isDirty = true;
            L.S.fire('ui:end');
            layer.zoomTo();
        };

        var detectTypeFromFile = function (f) {
            var filename = f.name ? escape(f.name.toLowerCase()) : '';
            function ext(_) {
                return filename.indexOf(_) !== -1;
            }
            if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
                return 'kml';
            }
            if (ext('.gpx')) return 'gpx';
            if (ext('.geojson') || ext('.json')) return 'geojson';
            if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
                return 'dsv';
            }
            if (ext('.xml')) return 'osm';
        };

        var processFile = function () {
            var files = fileInput.files,
                output = [],
                reader, content, geojson, layer;

            var process = function (f) {
                reader = new FileReader();
                reader.readAsText(f);
                reader.onload = function (e) {
                    processContent(e.target.result);
                };
            };

            for (var i = 0, f; f = files[i]; i++) {
                process(f);
            }
        };

        var processUrl = function (url) {
            url = map.localizeUrl(url);
            L.S.Xhr._ajax({verb: 'GET', uri: url, callback: function (data) {
                processContent(data);
            }});
        };

        var submit = function () {
            if (fileInput.files) {
                processFile();
            }
            if (rawInput.value) {
                processContent(rawInput.value);
            }
            if (urlInput.value) {
                processUrl(urlInput.value);
            }
            if (presetSelect.selectedIndex !== 0) {
                processUrl(presetSelect[presetSelect.selectedIndex].value);
            }
        };
        L.DomEvent.on(submitInput, 'click', submit, this);
        L.DomEvent.on(fileInput, 'change', function (e) {
            var f = e.target.files[0],
                type = detectTypeFromFile(f);
            if (type) {
                typeInput.value = type;
            }
        }, this);
        L.S.fire('ui:start', {data: {html: container}});
    },

    openBrowser: function () {
        this.whenReady(function () {
            if (this._controls.datalayersControl) {
            this._controls.datalayersControl.openBrowser();
            }
        });
    },

    displayCaption: function () {
        var container = L.DomUtil.create('div', 'storage-caption'),
            title = L.DomUtil.create('h4', '', container);
        title.innerHTML = this.options.name;
        if (this.options.description) {
            var description = L.DomUtil.create('div', 'storage-map-description', container);
            description.innerHTML = L.Util.toHTML(this.options.description);
        }
        this.eachDataLayer(function (datalayer) {
            var p = L.DomUtil.create('p', '', container),
                color = L.DomUtil.create('span', 'datalayer_color', p),
                title = L.DomUtil.create('strong', '', p),
                description = L.DomUtil.create('span', '', p);
            if (datalayer.options.color) {
                color.style.backgroundColor = datalayer.options.color;
            }
            title.innerHTML = datalayer.options.name + ' ';
            if (datalayer.options.description) {
                description.innerHTML = datalayer.options.description;
            }
        });
        L.DomUtil.create('hr', '', container);
        title = L.DomUtil.create('h5', '', container);
        title.innerHTML = L._('User content credits');
        var contentCredit = L.DomUtil.create('p', '', container),
            licence = L.DomUtil.create('a', '', contentCredit);
        if (this.options.licence) {
            licence.innerHTML = this.options.licence.name;
            licence.href = this.options.licence.url;
            contentCredit.innerHTML =  L._('Map user content has been published under licence')
                                       + ' ' + contentCredit.innerHTML;
        }
        L.DomUtil.create('hr', '', container);
        title = L.DomUtil.create('h5', '', container);
        title.innerHTML = L._('Map background credits');
        var tilelayerCredit = L.DomUtil.create('p', '', container),
            name = L.DomUtil.create('strong', '', tilelayerCredit),
            attribution = L.DomUtil.create('span', '', tilelayerCredit);
        name.innerHTML = this.selected_tilelayer.options.name + ' ';
        attribution.innerHTML = this.selected_tilelayer.getAttribution();
        L.DomUtil.create('hr', '', container);
        var umapCredit = L.DomUtil.create('p', '', container),
            urls = {
                leaflet: 'http://leafletjs.com',
                django: 'https://www.djangoproject.com',
                umap: 'http://wiki.openstreetmap.org/wiki/UMap'
            };
        umapCredit.innerHTML = L._("Powered by <a href='{leaflet}'>Leaflet</a> and <a href='{django}'>Django</a>, glued by <a href='{umap}'>uMap project</a>.", urls);

        L.S.fire('ui:start', {data: {html: container}});
    },

    eachDataLayer: function (method, context) {
        for (var i in this.datalayers) {
            if (this.datalayers.hasOwnProperty(i)) {
                method.call(context, this.datalayers[i]);
            }
        }
    },

    reset: function () {
        this.eachDataLayer(function (datalayer) {
            if (datalayer.isDirty) {
                datalayer.reset();
            }
        });
        this.deleted_datalayers.forEach(function (datalayer) {
            datalayer.connectToMap();
            datalayer.reset();
        });
        this.updateDatalayersControl();
        this.resetOptions();
        this.initTileLayers();
        this.isDirty = false;
    },

    saveDatalayers: function () {
        this.eachDataLayer(function (datalayer) {
            if (datalayer.isDirty) {
                datalayer.save();
            }
        });
    },

    deleteDatalayers: function () {
        this.deleted_datalayers.forEach(function (datalayer) {
            datalayer.saveDelete();
        });
        this.deleted_datalayers = Array();
    },

    save: function () {
        if (this.isDirty) {
            this.selfSave();
        }
    },

    getEditUrl: function() {
        return L.Util.template(this.options.urls.map_update, {'map_id': this.options.storage_id});
    },

    getCreateUrl: function() {
        return L.Util.template(this.options.urls.map_create);
    },

    getSaveUrl: function () {
        return (this.options.storage_id && this.getEditUrl()) || this.getCreateUrl();
    },

    selfSave: function () {
        // save options to DB
        var editableOptions = [
            'zoom',
            'datalayersControl',
            'zoomControl',
            'scaleControl',
            'moreControl',
            'miniMap',
            'displayCaptionOnLoad',
            'displayPopupFooter',
            'displayDataBrowserOnLoad',
            'tilelayersControl',
            'name',
            'description',
            'licence',
            'tilelayer'
        ], properties = {};
        for (var i = editableOptions.length - 1; i >= 0; i--) {
            if (typeof this.options[editableOptions[i]] !== "undefined") {
                properties[editableOptions[i]] = this.options[editableOptions[i]];
            }
        }
        var geojson = {
            type: "Feature",
            geometry: this.geometry(),
            properties: properties
        };
        this.backupOptions();
        var formData = new FormData();
        formData.append("name", this.options.name);
        formData.append("center", JSON.stringify(this.geometry()));
        formData.append("settings", JSON.stringify(geojson));
        this.post(this.getSaveUrl(), {
            data: formData,
            callback: function (data) {
                var duration = 3000;
                if (!this.options.storage_id) {
                    duration = 100000; // we want a longer message at map creation (TODO UGLY)
                    this.options.storage_id = data.id;
                    if (history && history.pushState) {
                        history.pushState({}, this.options.name, data.url);
                    } else {
                        window.location = data.url;
                    }
                }
                this.saveDatalayers();
                this.deleteDatalayers();
                if (data.info) {
                    L.S.fire('ui:alert', {content: data.info, level: 'info', duration: duration});
                }
                L.S.fire('ui:end');
                this.isDirty = false;
            },
            context: this
        });
    },

    geometry: function() {
        /* Return a GeoJSON geometry Object */
        var latlng = this.latLng(this.options.center || this.getCenter());
        return {
            type: "Point",
            coordinates: [
                latlng.lng,
                latlng.lat
            ]
        };
    },

    defaultDataLayer: function () {
        var self = this,
            datalayer;
        for (var i in this.datalayers) {
            if (this.datalayers.hasOwnProperty(i)) {
                datalayer = this.datalayers[i];
                if (datalayer.isVisible() && !datalayer.isRemoteLayer()) {
                    return datalayer;
                }
            }
        }
        if (datalayer && !datalayer.isRemoteLayer()) {
            // No datalayer visibile, let's force one
            this.addLayer(datalayer.layer);
            return datalayer;
        }
        return new L.S.DataLayer(this, {});
    },

    getDataLayerByStorageId: function (storage_id) {
        var datalayer;
        for (var i in this.datalayers) {
            if (this.datalayers.hasOwnProperty(i)) {
                datalayer = this.datalayers[i];
                if (datalayer.storage_id == storage_id) {
                    return datalayer;
                }
            }
        }
    },

    edit: function () {
        if(!this.editEnabled) return;
        var self = this,
            container = L.DomUtil.create('div'),
            metadataFields = [
                'options.name',
                'options.description',
                ['options.licence', {handler: 'LicenceChooser', label: L._('licence')}]
            ],
            title = L.DomUtil.create('h4', '', container);
        title.innerHTML = L._('Edit map properties');
        var builder = new L.S.FormBuilder(this, metadataFields);
        form = builder.build();
        container.appendChild(form);
        var UIFields = [
            ['options.moreControl', {handler: 'CheckBox', helpText: L._("Do you want to display the 'more' control?")}],
            ['options.datalayersControl', {handler: 'CheckBox', helpText: L._("Do you want to display the data layers control?")}],
            ['options.zoomControl', {handler: 'CheckBox', helpText: L._("Do you want to display zoom control?")}],
            ['options.scrollWheelZoom', {handler: 'CheckBox', helpText: L._("Allow scroll wheel zoom?")}],
            ['options.miniMap', {handler: 'CheckBox', helpText: L._("Do you want to display a minimap?")}],
            ['options.scaleControl', {handler: 'CheckBox', helpText: L._("Do you want to display the scale control?")}],
            ['options.displayCaptionOnLoad', {handler: 'CheckBox', helpText: L._("Do you want to display map caption on load?")}],
            ['options.displayDataBrowserOnLoad', {handler: 'CheckBox', helpText: L._("Do you want to display data browser on load?")}],
            ['options.displayPopupFooter', {handler: 'CheckBox', helpText: L._("Do you want to display popup footer?")}]
        ];
        builder = new L.S.FormBuilder(this, UIFields, {
            callback: this.initControls,
            callbackContext: this
        });
        var controlsOptions = L.DomUtil.createFieldset(container, L._('Display options'));
        controlsOptions.appendChild(builder.build());
        if (typeof this.options.tilelayer !== 'object') {
            this.options.tilelayer = {};
        }
        var tilelayerFields = [
            ['options.tilelayer.name', {handler: 'BlurInput', placeholder: L._('display name')}],
            ['options.tilelayer.url_template', {handler: 'BlurInput', helpText: L._("Supported scheme") + ': http://{s}.domain.com/{z}/{x}/{y}.png', placeholder: 'url'}],
            ['options.tilelayer.maxZoom', {handler: 'BlurIntInput', placeholder: L._('max zoom')}],
            ['options.tilelayer.minZoom', {handler: 'BlurIntInput', placeholder: L._('min zoom')}],
            ['options.tilelayer.attribution', {handler: 'BlurInput', placeholder: L._('attribution')}]
        ];
        var customTilelayer = L.DomUtil.createFieldset(container, L._('Custom background'));
        builder = new L.S.FormBuilder(this, tilelayerFields, {
            callback: this.initTileLayers,
            callbackContext: this
        });
        customTilelayer.appendChild(builder.build());
        var advancedActions = L.DomUtil.createFieldset(container, L._('Advanced actions'));
        var del = L.DomUtil.create('a', 'storage-delete', advancedActions);
        del.href = "#";
        del.innerHTML = L._('Delete');
        L.DomEvent
            .on(del, 'click', L.DomEvent.stop)
            .on(del, 'click', this.del, this);
        var clone = L.DomUtil.create('a', 'clone-map-button', advancedActions);
        clone.href = "#";
        clone.innerHTML = L._('Clone this map');
        L.DomEvent
            .on(clone, 'click', L.DomEvent.stop)
            .on(clone, 'click', this.clone, this);
        L.S.fire('ui:start', {data: {html: container}});
    },

    enableEdit: function(e) {
        L.DomUtil.addClass(document.body, "storage-edit-enabled");
        this.editEnabled = true;
    },

    disableEdit: function(e) {
        L.DomUtil.removeClass(document.body, "storage-edit-enabled");
        this.editEnabled = false;
    },

    initEditBar: function () {
        var container = L.DomUtil.create('div', 'storage-main-edit-toolbox', this._controlContainer),
            title = L.DomUtil.add('h3', '', container, L._("Editing") + '&nbsp;'),
            name = L.DomUtil.create('a', 'storage-click-to-edit', title),
            setName = function () {
                name.innerHTML = this.options.name || L._('Untitled map');
            };
        L.bind(setName, this)();
        L.DomEvent.on(name, 'click', this.edit, this);
        this.on('synced', L.bind(setName, this));
        this.help.button(title, 'edit');
        var save = L.DomUtil.create('a', "leaflet-control-edit-save button", container);
        save.href = '#';
        save.title = L._("Save current edits") + ' (Ctrl-S)';
        save.innerHTML = L._('Save');
        var cancel = L.DomUtil.create('a', "leaflet-control-edit-cancel button", container);
        cancel.href = '#';
        cancel.title = L._("Cancel edits");
        cancel.innerHTML = L._('Cancel');
        var disable = L.DomUtil.create('a', "leaflet-control-edit-disable", container);
        disable.href = '#';
        disable.title = disable.innerHTML = L._('Disable editing');


        L.DomEvent
            .addListener(disable, 'click', L.DomEvent.stop)
            .addListener(disable, 'click', function (e) {
                this.disableEdit(e);
                L.S.fire('ui:end');
            }, this);

        L.DomEvent
            .addListener(save, 'click', L.DomEvent.stop)
            .addListener(save, 'click', this.save, this);

        L.DomEvent
            .addListener(cancel, 'click', L.DomEvent.stop)
            .addListener(cancel, 'click', function (e) {
                if (!confirm(L._("Are you sure you want to cancel your changes?"))) return;
                this.disableEdit(e);
                L.S.fire('ui:end');
                this.reset();
            }, this);
    },

    getEditActions: function () {

        return [
            {
                title: L._('Import data') + ' (Ctrl+I)',
                className: 'upload-data',
                callback: this.importPanel,
                context: this
            },
            {
                title: L._('Edit map settings'),
                className: 'update-map-settings',
                callback: this.edit,
                context: this
            },

            {
                title: L._('Update permissions and editors'),
                className: 'update-map-permissions',
                callback: this.updatePermissions,
                context: this
            },

            {
                title: L._('Change tilelayers'),
                className: 'update-map-tilelayers',
                callback: this.updateTileLayers,
                context: this
            },

            {
                title: L._('Save this center and zoom'),
                className: 'update-map-extent',
                callback: this.updateExtent,
                context: this
            }
        ];
    },

    del: function () {
        if (confirm(L._('Are you sure you want to delete this map?'))) {
            var url = L.Util.template(this.options.urls.map_delete, {'map_id': this.options.storage_id});
            this.post(url);
        }
    },

    clone: function () {
        if (confirm(L._('Are you sure you want to clone this map and all its datalayers?'))) {
            var url = L.Util.template(this.options.urls.map_clone, {'map_id': this.options.storage_id});
            this.post(url);
        }
    },

    initLoader: function () {
        this.loader = new L.Control.Loading();
        this.loader.onAdd(this);
    },

    post: function (url, options) {
        options = options || {};
        options.listener = this;
        L.S.Xhr.post(url, options);
    },

    get: function (url, options) {
        options = options || {};
        options.listener = this;
        L.S.Xhr.get(url, options);
    },

    ajax: function (options) {
        options.listener = this;
        L.S.Xhr._ajax(options);
    },

    initContextMenu: function () {
        this.contextmenu = new L.S.ContextMenu(this);
        this.contextmenu.enable();
    },

    setContextMenuItems: function (e) {
        var items = [
            {
                text: L._('Zoom in'),
                callback: function () {this.zoomIn();}
            },
            {
                text: L._('Zoom out'),
                callback: function () {this.zoomOut();}
            }
        ];
        if (e && e.relatedTarget) {
            if (e.relatedTarget.getContextMenuItems) {
                items = items.concat(e.relatedTarget.getContextMenuItems());
            }
        }
        if (this.options.allowEdit) {
            items.push('-');
            if (this.editEnabled) {
                items.push(
                    {
                        text: L._('Stop editing') + ' (Ctrl+E)',
                        callback: this.disableEdit
                    },
                    {
                        text: L._('Draw a marker') + ' (Ctrl-M)',
                        callback: this._controls.draw.startMarker,
                        context: this._controls.draw
                    },
                    {
                        text: L._('Draw a polygon') + ' (Ctrl-P)',
                        callback: this._controls.draw.startPolygon,
                        context: this._controls.draw
                    },
                    {
                        text: L._('Draw a line') + ' (Ctrl-L)',
                        callback: this._controls.draw.startPolyline,
                        context: this._controls.draw
                    }
                );
                items.push('-');
                items.push({
                    text: L._('Help'),
                    callback: function () { this.help.show('edit');}
                });
            } else {
                items.push({
                    text: L._('Start editing') + ' (Ctrl+E)',
                    callback: this.enableEdit
                });
            }
        }
        items.push('-',
            {
                text: L._('Browse data'),
                callback: this.openBrowser
            },
            {
                text: L._('About'),
                callback: this.displayCaption
            }
        );
        if (this.options.urls.routing) {
            items.push('-',
                {
                    text: L._('Directions from here'),
                    callback: this.openExternalRouting
                }
            );
        }
        this.options.contextmenuItems = items;
    },

    openExternalRouting: function (e) {
        var url = this.options.urls.routing;
        if (url) {
            var params = {
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                locale: L.locale
            };
            window.open(L.Util.template(url, params));
        }
        return;
    },

    getMap: function () {
        return this;
    },

    localizeUrl: function (url) {
        var replace = {
                bbox: this.getBounds().toBBoxString(),
                north: this.getBounds().getNorthEast().lat,
                east: this.getBounds().getNorthEast().lng,
                south: this.getBounds().getSouthWest().lat,
                west: this.getBounds().getSouthWest().lng,
                lat: this.getCenter().lat,
                lng: this.getCenter().lng,
                zoom: this.getZoom()
            };
        replace.left = replace.west;
        replace.bottom = replace.south;
        replace.right = replace.east;
        replace.top = replace.north;
        return L.Util.template(url, replace);
    }

});