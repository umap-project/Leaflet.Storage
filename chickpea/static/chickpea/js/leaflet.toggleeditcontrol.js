L.Control.ToggleEdit = L.Control.Draw.extend({
    options: {
        position: 'topright',
        polygon: null,  // Later
        rectangle: null,  // Later
        circle: null  // Later
    },

    initialize: function(map, options) {
        this._map = map;
        L.Control.Draw.prototype.initialize.call(this, options);
        this.options.marker = {
            icon: new L.ChickpeaIcon(this._map)
        };
    },

    onAdd: function (map) {
        var container = L.Control.Draw.prototype.onAdd.call(this, map);
        // var container = L.DomUtil.create('div', "leaflet-control-edit");
        // this._createNewOverlayButton(map, container);
        this._createUpdateMapExtentButton(map, container);
        this._createUpdateMapTileLayersButton(map, container);
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
                self._disableEdit(e, map, container);
            }
            else {
                self._enableEdit(e, map, container);
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

    _createUpdateMapInfosButton: function(map, container) {
        this._createButton(
            'Edit map infos',
            'update-map-infos',
            container,
            function(e) { map.updateInfos();},
            {}
        );
    },

    _createNewOverlayButton: function(map, container) {
        this._createButton(
            'Add an overlay',
            'add-overlay',
            container,
            function() {},
            {}
        );
    },

    _enableEdit: function(e, map, container) {
        L.DomUtil.addClass(container, "control-enabled");
        map.editEnabled = true;
    },
    _disableEdit: function(e, map, container) {
        L.DomUtil.removeClass(container, "control-enabled");
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
            { marker: new L.ChickpeaMarker(this._map, null, this._marker.getLatLng()) }
        );
        this.disable();
    }
});

L.Polyline.Draw.include({

    _finishShape: function () {
        this._map.fire(
            'draw:poly-created',
            { poly: new L.ChickpeaPolyline(this._map, null, this._poly.getLatLngs(), this.options.shapeOptions) }
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
            var url = L.Util.template(this.options.urls.map_embed, {'pk': map.options.chickpea_id});
            L.Util.Xhr.get(url, {'dataType':'json'});
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

L.Control.ChickpeaLayers = L.Control.Layers.extend({
    options: {},

    onAdd: function (map) {
        var container = L.Control.Layers.prototype.onAdd.call(this, map);
        this._createNewOverlayButton(map, container);
        return container;
    },

    _createNewOverlayButton: function (map, container) {
        var link = L.DomUtil.create('a', "add-overlay", container);
        link.innerHTML = link.title = 'Add a category';
        link.href = '#';
        var handle_response = function (data) {
            L.Util.chickpea_modal(data.html);
            var form_id = "category_edit";
            var submit_form = function (e) {
                L.Util.Xhr.submit_form(form_id, {
                    'callback': function (data) {
                        if (data.category) {
                            /* Means success */
                            map._createOverlay(data.category);
                            L.Util.chickpea_alert("Category successfuly created", "info");
                        }
                        else {
                            // Let's start again
                            handle_response(data);
                        }
                    },
                    'dataType': 'json'
                });
            };
            var form = L.DomUtil.get(form_id);
        L.DomEvent
            .on(form, 'submit', L.DomEvent.stopPropagation)
            .on(form, 'submit', L.DomEvent.preventDefault)
            .on(form, 'submit', submit_form);
        };
        var fn = function (e) {
            var url = L.Util.template(this.options.urls.category_add, {'map_id': map.options.chickpea_id});
            L.Util.Xhr.get(url, {
                'dataType':'json',
                'callback': handle_response
            });
        };
        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, map)
            .on(link, 'dblclick', L.DomEvent.stopPropagation);
    }
});
