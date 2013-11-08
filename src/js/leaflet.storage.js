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
    enablePolylineDraw: true
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

        var edited_feature = null;
        try {
            Object.defineProperty(this, 'edited_feature', {
                get: function () {
                    return edited_feature;
                },
                set: function (feature) {
                    if (edited_feature && edited_feature != feature) {
                        edited_feature.endEdit();
                    }
                    edited_feature = feature;
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

        this.populateTileLayers(this.options.tilelayers);
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
            this.whenReady(function () {
                if (this.controls.datalayersControl) {
                this._controls.datalayersControl.openBrowser();
                }
            });
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
            this.editHelp();
        }

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
                this.edited_feature = null;
            }, this);
            this.initEditBar();
            var editShortcuts = function (e) {
                var key = e.keyCode,
                    S = 83,
                    E = 69;
                if (key == E && e.ctrlKey && !this.editEnabled) {
                    L.DomEvent.stop(e);
                    this.enableEdit();
                } else if (key == E && e.ctrlKey && this.editEnabled && !this.isDirty) {
                    L.DomEvent.stop(e);
                    this.disableEdit();
                    L.S.fire('ui:end');
                }
                if (key == S && e.ctrlKey && this.isDirty) {
                    L.DomEvent.stop(e);
                    this.save();
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
    },

    overrideBooleanOptionFromQueryString: function (name) {
        L.Util.setBooleanFromQueryString(this.options, name);
    },

    initControls: function () {
        this._controls = this._controls || {};
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
            this.toggleEditControl = new L.Storage.EditControl(this);
            this.addControl(this.toggleEditControl);
            var options = this.options.editOptions ? this.options.editOptions : {};
            this.drawControl = new L.Storage.DrawControl(this, options);
            this.addControl(this.drawControl);
        }
        if (this.options.moreControl) {
            this._controls.moreControl = (new L.Storage.MoreControls()).addTo(this);
            this._controls.homeControl = (new L.Storage.HomeControl()).addTo(this);
            this._controls.locateControl = (new L.Storage.LocateControl()).addTo(this);
            this._controls.jumpToLocationControl = (new L.Storage.JumpToLocationControl()).addTo(this);
            this._controls.embedControl = (new L.Control.Embed(this, this.options.embedOptions)).addTo(this);
            this._controls.tilelayersControl = new L.Storage.TileLayerControl().addTo(this);
            this._controls.editInOSMControl = (new L.Control.EditInOSM({position: 'topleft'})).addTo(this);
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
    },

    populateTileLayers: function (tilelayers) {
        this.tilelayers = Array();
        for(var i in tilelayers) {
            if(tilelayers.hasOwnProperty(i)) {
                this.addTileLayer(tilelayers[i]);
            }
        }
        if (!this.selected_tilelayer) {
            this.selectTileLayer(this.tilelayers[0]);
        }
    },

    createTileLayer: function (tilelayer) {
        return new L.TileLayer(tilelayer.url_template, tilelayer);
    },

    selectTileLayer: function (tilelayer) {
        if (tilelayer === this.selected_tilelayer) { return; }
        this.addLayer(tilelayer);
        if (this.selected_tilelayer) {
            this.removeLayer(this.selected_tilelayer);
        }
        this.selected_tilelayer = tilelayer;
        this.fire('baselayerchange', {layer: tilelayer});
    },

    addTileLayer: function (options) {
        var tilelayer = this.createTileLayer(options);
        // Add only the first to the map, to make it visible,
        // and the other only when user click on them
        if(this.options.tilelayer && this.options.tilelayer.url_template === tilelayer._url) {
            this.selectTileLayer(tilelayer);
        }
        this.tilelayers.push(tilelayer);
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
        L.Storage.fire("ui:alert", {"content": L._('The zoom and center have been setted.'), "level": "info"});
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
            iframe = L.DomUtil.create('textarea', 'storage-share-iframe', container),
            url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?scaleControl=0&miniMap=0&scrollWheelZoom=0&allowEdit=0';
        iframe.innerHTML = '<iframe width="100%" height="300" frameBorder="0" src="' + url +'"></iframe><p><a href="http://u.osmfr.org/en/map/demo_1">See full screen</a></p>';
        if (this.options.shortUrl) {
            var shortUrl = L.DomUtil.create('input', 'storage-short-url', container);
            shortUrl.type = "text";
            shortUrl.value = this.options.shortUrl;
        }
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
        var url = L.Util.template(this.options.urls.map_update_permissions, {'map_id': this.options.storage_id});
        L.Storage.Xhr.get(url, {
            'listen_form': {'id': 'map_edit'}
        });
    },

    uploadData: function () {
        var container = L.DomUtil.create('div', 'storage-upload'),
            fileInput = L.DomUtil.create('input', '', container),
            urlInput = L.DomUtil.create('input', '', container),
            rawInput = L.DomUtil.create('textarea', '', container),
            typeInput = L.DomUtil.create('select', '', container),
            layerInput = L.DomUtil.create('select', '', container),
            submitInput = L.DomUtil.create('input', '', container),
            map = this, option,
            types = ['geojson', 'csv', 'gpx', 'kml'];
        fileInput.type = "file";
        submitInput.type = "button";
        submitInput.value = L._('Import');
        submitInput.className = "button";
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

        var toFeatures = function (geojson) {
            var layerId = layerInput[layerInput.selectedIndex].value;
            layer = map.datalayers[layerId];
            layer.addData(geojson);
            layer.isDirty = true;
            L.S.fire('ui:end');
            layer.zoomTo();
        };

        var toDom = function (x) {
            return (new DOMParser()).parseFromString(x, 'text/xml');
        };

        var detectType = function (f) {
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
            if (ext('.xml')) return 'xml';
        };

        var processContent = function (c) {
            var type = typeInput.value;
            if (type === "csv") {
                csv2geojson.csv2geojson(c, {
                    delimiter: 'auto'
                }, function(err, result) {
                    if (err) {
                        L.S.fire('ui:alert', {content: 'error in csv', level: 'error'});
                    } else {
                        toFeatures(result);
                    }
                });
            } else if (type === 'gpx') {
                toFeatures(toGeoJSON.gpx(toDom(c)));
            } else if (type === 'kml') {
                toFeatures(toGeoJSON.kml(toDom(c)));
            } else if (type === 'xml') {
                toFeatures(osm_geojson.osm2geojson(toDom(c)));
            } else if (type === "geojson") {
                try {
                    gj = JSON.parse(c);
                    toFeatures(gj);
                } catch(err) {
                    L.S.fire('ui:alert', {content: 'Invalid JSON file: ' + err});
                    return;
                }
            }
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

        var processUrl = function () {
            var url = urlInput.value,
                replace = {
                    bbox: map.getBounds().toBBoxString(),
                    north: map.getBounds().getNorthEast().lat,
                    east: map.getBounds().getNorthEast().lng,
                    south: map.getBounds().getSouthWest().lat,
                    west: map.getBounds().getNorthEast().lng,
                    lat: map.getCenter().lat,
                    lng: map.getCenter().lng,
                    zoom: map.getZoom()
                };
            replace['left'] = replace['west'];
            replace['bottom'] = replace['south'];
            replace['right'] = replace['east'];
            replace['top'] = replace['north'];
            url = L.Util.template(url, replace);
            L.S.Xhr._ajax('GET', url, null, function (data) {
                processContent(data);
            });
        };

        var submit = function () {
            if (fileInput.files) {
                processFile();
            }
            if (rawInput.value) {
                processContent(rawInput.value);
            }
            if (urlInput.value) {
                processUrl();
            }
        };
        L.DomEvent.on(submitInput, 'click', submit, this);
        L.DomEvent.on(fileInput, 'change', function (e) {
            var f = e.target.files[0],
                type = detectType(f);
            if (type) {
                typeInput.value = type;
            }
        }, this);
        L.S.fire('ui:start', {data: {html: container}});
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
                color.backgroundColor = datalayer.options.color;
            }
            title.innerHTML = datalayer.options.name + ' ';
            description.innerHTML = datalayer.options.description;
        });
        L.DomUtil.create('hr', '', container);
        title = L.DomUtil.create('h5', '', container);
        title.innerHTML = L._('User content credits');
        var contentCredit = L.DomUtil.create('p', '', container),
            licence = L.DomUtil.create('a', '', contentCredit);
        licence.innerHTML = this.options.licence.name;
        licence.href = this.options.licence.url;
        contentCredit.innerHTML =  L._('Map user content has been published under licence')
                                   + ' ' + contentCredit.innerHTML;
        L.DomUtil.create('hr', '', container);
        title = L.DomUtil.create('h5', '', container);
        title.innerHTML = L._('Map background credits');
        var tilelayerCredit = L.DomUtil.create('p', '', container),
            name = L.DomUtil.create('strong', '', tilelayerCredit),
            attribution = L.DomUtil.create('span', '', tilelayerCredit);
        name.innerHTML = this.selected_tilelayer.options.name + ' ';
        attribution.innerHTML = this.selected_tilelayer.options.attribution;
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
            datalayer.reset();
        });
        this.options = L.extend({}, this._backupOptions);
        this.initControls();
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
        L.Storage.Xhr.post(this.getSaveUrl(), {
            data: formData,
            callback: function (data) {
                var duration = 3000;
                if (!this.options.storage_id) {
                    duration = 100000; // we want a longer message at map creation (TODO UGLY)
                    this.options.storage_id = data.pk;
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
                if (this.hasLayer(datalayer)) {
                    return datalayer;
                }
            }
        }
        if (datalayer) {
            // No datalayer visibile, let's force one
            this.addLayer(datalayer);
            return datalayer;
        }
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
        var controlsOptions = L.DomUtil.create('fieldset', 'toggle', container);
        var controlsOptionsTitle = L.DomUtil.create('legend', 'style_options_toggle', controlsOptions);
        controlsOptionsTitle.innerHTML = L._('Display options');
        controlsOptions.appendChild(builder.build());
        var advancedActions = L.DomUtil.create('fieldset', 'toggle', container);
        var advancedActionsTitle = L.DomUtil.create('legend', 'style_options_toggle', advancedActions);
        advancedActionsTitle.innerHTML = L._('Advanced actions');
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
            title = L.DomUtil.create('h3', '', container);
        title.innerHTML = L._("Editing ");
        var name = L.DomUtil.create('a', 'storage-click-to-edit', title);
        var setName = function () {
            name.innerHTML = this.options.name || L._('Untitled map');
        };
        L.bind(setName, this)();
        L.DomEvent.on(name, 'click', this.edit, this);
        this.on('synced', L.bind(setName, this));
        var help = L.DomUtil.create('a', 'storage-help', container);
        help.href = "#";
        help.title = help.innerHTML = L._('help');
        L.DomEvent
            .on(help, 'click', L.DomEvent.stop)
            .on(help, 'click', this.editHelp, this);
        var save = L.DomUtil.create('a', "leaflet-control-edit-save button", container);
        save.href = '#';
        save.title = L._("Save current edits");
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

    editHelp: function () {
        var container = L.DomUtil.create('div', ''),
            title = L.DomUtil.create('h3', '', container),
            actionsContainer = L.DomUtil.create('ul', 'storage-edit-actions', container);
        var addAction = function (action) {
            var actionContainer = L.DomUtil.create('li', action.className, actionsContainer);
            actionContainer.innerHTML = action.title;
            L.DomEvent.on(actionContainer, 'click', action.callback, action.context);
        };
        title.innerHTML = L._('Where do we go from here?');
        var actions = this.getEditActions();
        actions.unshift(
            {
                title: L._('Draw a polyline'),
                className: 'leaflet-draw-draw-polyline',
                callback: this.drawControl.startPolyline,
                context: this.drawControl
            },
            {
                title: L._('Draw a polygon'),
                className: 'leaflet-draw-draw-polygon',
                callback: this.drawControl.startPolygon,
                context: this.drawControl
            },
            {
                title: L._('Draw a marker'),
                className: 'leaflet-draw-draw-marker',
                callback: this.drawControl.startMarker,
                context: this.drawControl
            }
        );
        for (var i = 0; i < actions.length; i++) {
            addAction(actions[i]);
        }
        L.S.fire('ui:start', {data: {html: container}});
    },

    getEditActions: function () {

        return [
            {
                title: L._('Upload data'),
                className: 'upload-data',
                callback: this.uploadData,
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
            L.S.Xhr.post(url);
        }
    },

    clone: function () {
        if (confirm(L._('Are you sure you want to clone this map and all its datalayers?'))) {
            var url = L.Util.template(this.options.urls.map_clone, {'map_id': this.options.storage_id});
            L.S.Xhr.post(url);
        }
    }

});