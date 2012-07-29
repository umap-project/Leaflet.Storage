L.ChickpeaIcon = L.Icon.extend({
    initialize: function(map, options) {
        this.map = map;
        var default_options = {
            iconSize: new L.Point(32, 40),
            iconAnchor: new L.Point(16, 40),
            popupAnchor: new L.Point(-1, -40),
            shadowSize: new L.Point(40, 40),
            iconUrl: this.map.options.default_icon_url
        };
        options = L.Util.extend({}, default_options, options);
        L.Icon.prototype.initialize.call(this, options);
        if(this.options.overlay) {
            this.overlay = this.options.overlay;
        }
    },
    _createImg: function(src) {
        var icon = L.DomUtil.create('div');
        var container = L.DomUtil.create('div', 'icon_container', icon);
        var arrow = L.DomUtil.create('div', 'icon_arrow', icon);
        var img = L.DomUtil.create('img', null, container);
        img.src = src;
        if(this.overlay) {
            container.style.backgroundColor = this.overlay.chickpea_color;
            arrow.style.borderTopColor = this.overlay.chickpea_color;
        }
        return icon;
    },
    _getIconUrl: function (name) {
        var url;
        if(this.overlay[name + 'Url']) {
            url = this.overlay[name + 'Url'];
        }
        else {
            url = this.options[name + 'Url'];
        }
        return url;
    }
});