L.Map.mergeOptions({
    base_layers: null,
    overlay_layers: null,
    datalayers: [],
    zoom: 10,
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
    editInOSMControlOptions: {},
    scaleControl: true,
    miniMap: false,
    displayCaptionOnLoad: false,
    name: '',
    description: '',
    displayPopupFooter: false,
    displayDataBrowserOnLoad: false,
    demoTileInfos: {s:'a', z:9, x:265, y:181},
    tilelayersControl: true
});

L.Storage.Map.include({
    initialize: function (/* DOM element or id*/ el, /* Object*/ options) {
        // We manage it, so don't use Leaflet default behaviour
        if (options.locale) {
            L.setLocale(options.locale);
        }
        var center = options.center;
        delete options.center;
        var editInOSMControl = options.editInOSMControl;
        delete options.editInOSMControl;
        var zoomControl = typeof options.zoomControl !== "undefined" ? options.zoomControl : true;
        options.zoomControl = false;
        L.Map.prototype.initialize.call(this, el, options);
        this.name = this.options.name;
        this.description = this.options.description;
        this.demoTileInfos = this.options.demoTileInfos;
        this.options.center = center;
        this.options.editInOSMControl = editInOSMControl;
        this.options.zoomControl = zoomControl;
        this.initControls();

        // User must provide a pk
        if (typeof this.options.storage_id == "undefined") {
            alert("ImplementationError: you must provide a storage_id for Storage.Map.");
        }

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
        }


        if (this.options.hash) {
            this.addHash();
        }
        this.initCenter();


        // Init control layers
        // It will be populated while creating the datalayers
        // Control is added as an initHook, to keep the order
        // with other controls
        this.populateTileLayers(this.options.tilelayers);

        // Global storage for retrieving datalayers
        this.datalayers = {};
        this.datalayers_index = Array();
        // create datalayers
        for(var j in this.options.datalayers) {
            if(this.options.datalayers.hasOwnProperty(j)){
                this._createDataLayer(this.options.datalayers[j]);
            }
        }
        if (options.displayCaptionOnLoad) {
            this.displayCaption();
        }
        else if (this.options.displayDataBrowserOnLoad && this.options.datalayersControl) {
            this.whenReady(function () {
                if (this.controls.datalayersControl) {
                this._controls.datalayersControl.openBrowser();
                }
            });
        }

        L.Storage.on('ui:ready', function () {
            this.invalidateSize({pan: false});
        }, this);

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
        this.backupOptions();
    },

    initControls: function () {
        this._controls = this._controls || {};
        for (var i in this._controls) {
            this.removeControl(this._controls[i]);
            delete this._controls[i];
        }
        if (this.options.homeControl) {
            this._controls.homeControl = (new L.Storage.HomeControl()).addTo(this);
        }
        if (this.options.locateControl) {
            this._controls.locateControl = (new L.Storage.LocateControl()).addTo(this);
        }
        if (this.options.jumpToLocationControl) {
            this._controls.jumpToLocationControl = (new L.Storage.JumpToLocationControl()).addTo(this);
        }
        if (this.options.zoomControl) {
            this._controls.zoomControl = (new L.Control.Zoom()).addTo(this);
        }
        if (this.options.scaleControl) {
            this._controls.scaleControl = L.control.scale().addTo(this);
        }
        if (this.options.embedControl) {
            this._controls.embedControl = (new L.Control.Embed(this, this.options.embedOptions)).addTo(this);
        }
        if (this.options.tilelayersControl) {
            this._controls.tilelayersControl = new L.Storage.TileLayerControl().addTo(this);
        }
        if (this.options.editInOSMControl) {
            this._controls.editInOSMControl = (new L.Control.EditInOSM(this.options.editInOSMControlOptions)).addTo(this);
        }
        if (this.options.datalayersControl) {
            this._controls.datalayersControl = new L.Storage.DataLayersControl().addTo(this);
        }
        if (this.options.miniMap) {
            this.whenReady(function () {
                this._controls.miniMap = new L.Control.MiniMap(this.selected_tilelayer).addTo(this);
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
        // Save in db the current center and zoom
        this.options.center = this.getCenter();
        this.options.zoom = this.getZoom();
        this.isDirty = true;
        L.Storage.fire("ui:alert", {"content": L._('The zoom and center have been setted.'), "level": "info"});
    },

    updateTileLayers: function () {
        var self = this,
            callback = function (tilelayer) {
                self.options.tilelayer = tilelayer.toJSON();
            };
        if (this._controls.tilelayersControl) {
            this._controls.tilelayersControl.openSwitcher({callback: callback});
        }
    },

    updateInfos: function () {
        var url = L.Util.template(this.options.urls.map_update, {'map_id': this.options.storage_id});
        L.Storage.Xhr.get(url, {
            'listen_form': {'id': 'map_edit'},  // 1. edit form
            'listen_link': [{
                'id': 'delete_map_button',  // 2. delete link
                'options': {
                    'listen_form': {'id': 'map_delete'},  // 3. confirm delete form
                    'cssClass': 'warning'
                }
            },
            {
                id: 'clone_map_button',
                options: {
                    confirm: L._('Are you sure you want to clone this map and all its datalayers and features?')
                }
            }]
        });
    },

    updatePermissions: function () {
        var url = L.Util.template(this.options.urls.map_update_permissions, {'map_id': this.options.storage_id});
        L.Storage.Xhr.get(url, {
            'listen_form': {'id': 'map_edit'}
        });
    },

    updateSettings: function () {
        var url = L.Util.template(this.options.urls.map_update_settings, {'map_id': this.options.storage_id});
        L.Storage.Xhr.get(url, {
            'listen_form': {'id': 'map_edit'}
        });
    },

    uploadData: function () {
        var map = this;
        var handle_response = function (data) {
            L.Storage.fire("ui:start", {'data': data, "cssClass": "upload-data"});
            var form_id = "upload_data",
                urlHelper = new L.Storage.FormHelper.ImportURL(map, form_id, {});
            L.Storage.Xhr.listen_form(form_id, {
                'callback': function (data) {
                    if (data.datalayer) {
                        var layer = map.datalayers[data.datalayer.pk];
                        layer.on('dataloaded', function (e) {
                            layer.zoomTo();
                        });
                        layer.clearLayers();
                        layer.fetchData();
                        L.Storage.fire('ui:end');
                        if (data.info) {
                            L.Storage.fire("ui:alert", {"content": data.info, "level": "info"});
                        }
                    }
                    else if (data.error) {
                        L.Storage.fire("ui:alert", {"content": data.error, "level": "error"});
                    }
                    else {
                        // start again
                        handle_response(data);
                    }
                }
            });
        };
        var url = L.Util.template(this.options.urls.upload_data, {'map_id': this.options.storage_id});
        L.Storage.Xhr.get(url, {
            'callback': handle_response
        });
    },

    displayCaption: function () {
        var url = L.Util.template(this.options.urls.map_infos, {'map_id': this.options.storage_id});
        L.Storage.Xhr.get(url);
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
        this.options = L.extend({}, this._backupOptions);
        this.initControls();
        this.isDirty = false;
    },

    save: function () {
        this.eachDataLayer(function (datalayer) {
            if (datalayer.isDirty) {
                datalayer.save();
            }
        });
        if (this.isDirty) {
            this.selfSave();
        }
        this.isDirty = false;
        L.S.fire('ui:end');
    },

    selfSave: function () {
        // save options to DB
        var editableOptions = [
            'zoom',
            'homeControl',
            'embedControl',
            'datalayersControl',
            'zoomControl',
            'locateControl',
            'jumpToLocationControl',
            'editInOSMControl',
            'scaleControl',
            'miniMap',
            'displayCaptionOnLoad',
            'displayPopupFooter',
            'displayDataBrowserOnLoad',
            'tilelayersControl',
            'name',
            'description'
        ],
            properties = {};
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
        console.log(geojson);
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

    edit: function () {
        if(!this.editEnabled) return;
        var self = this,
            container = L.DomUtil.create('div'),
            metadataFields = [
                'options.name',
                'options.description'
            ];
        var builder = new L.S.FormBuilder(this, metadataFields);
        form = builder.build();
        container.appendChild(form);
        var UIFields = [
            ['options.homeControl', 'CheckBox'],
            ['options.embedControl', 'CheckBox'],
            ['options.datalayersControl', 'CheckBox'],
            ['options.tilelayersControl', 'CheckBox'],
            ['options.zoomControl', 'CheckBox'],
            ['options.miniMap', 'CheckBox'],
            ['options.editInOSMControl', 'CheckBox'],
            ['options.scaleControl', 'CheckBox'],
            ['options.locateControl', 'CheckBox'],
            ['options.jumpToLocationControl', 'CheckBox'],
            ['options.displayCaptionOnLoad', 'CheckBox'],
            ['options.displayDataBrowserOnLoad', 'CheckBox'],
            ['options.displayPopupFooter', 'CheckBox']
        ];
        builder = new L.S.FormBuilder(this, UIFields, {
            callback: this.initControls,
            callbackContext: this
        });
        container.appendChild(builder.build());
        L.S.fire('ui:start', {data: {html: container}});
    }

});