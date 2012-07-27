L.Control.ToggleEdit = L.Control.Draw.extend({
    options: {
        position: 'topright',
        polyline: null,  // Later
        polygon: null,  // Later
        rectangle: null,  // Later
        circle: null,  // Later
        marker: {}
    },

    onAdd: function (map) {
        var container = L.Control.Draw.prototype.onAdd.call(this, map);
        // var container = L.DomUtil.create('div', "leaflet-control-edit");
        this._createToggleButton(map, container);
        return container
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
        }
        L.DomEvent
        .addListener(link, 'click', L.DomEvent.stopPropagation)
        .addListener(link, 'click', L.DomEvent.preventDefault)
        .addListener(link, 'click', fn);
    },
    _enableEdit: function(e, map, container) {
        L.DomUtil.addClass(container, "control-enabled");
        map.editEnabled = true;
    },
    _disableEdit: function(e, map, container) {
        L.DomUtil.removeClass(container, "control-enabled");                
        map.editEnabled = false;
    }
});

L.Map.addInitHook(function () {
    if (this.options.allowEdit) {
        this.toggleEditControl = new L.Control.ToggleEdit();
        this.addControl(this.toggleEditControl);
    }
});

L.Marker.Draw.include({

    _onClick: function (e) {
        // Overriding to instanciate our own Marker class
        // How to do it in a cleaner way? Asking upstream to add a hook?
        this._map.fire(
            'draw:marker-created',
            { marker: new L.ChickpeaMarker(null, this._marker.getLatLng(), { icon: this.options.icon }) }
        );
        this.disable();
    }
});