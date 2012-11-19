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
