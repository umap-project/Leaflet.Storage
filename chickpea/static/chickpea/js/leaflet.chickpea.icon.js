L.ChickpeaIcon = L.Icon.extend({
    initialize: function(map, options) {
        this.map = map;
        var default_options = {
            iconSize: new L.Point(32, 40),
            iconAnchor: new L.Point(16, 40),
            popupAnchor: new L.Point(-1, -40),
            shadowSize: new L.Point(40, 40),
            iconUrl: this.map.options.default_icon_url,
            overlay: {}
        };
        options = L.Util.extend({}, default_options, options);
        L.Icon.prototype.initialize.call(this, options);
        this.overlay = this.options.overlay;
    },
    _createImg: function(src) {
        this.elements = {}
        this.elements.main = L.DomUtil.create('div');
        this.elements.container = L.DomUtil.create('div', 'icon_container', this.elements.main);
        this.elements.arrow = L.DomUtil.create('div', 'icon_arrow', this.elements.main);
        this.elements.img = L.DomUtil.create('img', null, this.elements.container);
        this.elements.img.src = src;
        this._setColor();
        return this.elements.main;
    },
    _setColor: function() {
        if(this.overlay) {
            this.elements.container.style.backgroundColor = this.overlay.chickpea_color;
            this.elements.arrow.style.borderTopColor = this.overlay.chickpea_color;
        }
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