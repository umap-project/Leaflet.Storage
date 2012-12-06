L.ChickpeaIcon = L.DivIcon.extend({
    initialize: function(map, options) {
        this.map = map;
        var default_options = {
            iconSize: null,  // Made in css
            iconUrl: this.map.options.default_icon_url,
            feature: null
        };
        options = L.Util.extend({}, default_options, options);
        L.Icon.prototype.initialize.call(this, options);
        this.feature = this.options.feature;
    },

    _getIconUrl: function (name) {
        var url;
        if(this.feature && this.feature._getIconUrl(name)) {
            url = this.feature._getIconUrl(name);
        }
        else {
            url = this.options[name + 'Url'];
        }
        return url;
    }
});

L.ChickpeaIcon.Default = L.ChickpeaIcon.extend({
    initialize: function(map, options) {
        var default_options = {
            iconAnchor: new L.Point(16, 40),
            popupAnchor: new L.Point(0, -40),
            className: "chickpea-div-icon"
        };
        options = L.Util.extend({}, default_options, options);
        L.ChickpeaIcon.prototype.initialize.call(this, map, options);
    },

    _setColor: function() {
        if(this.feature) {
            var color = this.feature.getColor();
            this.elements.container.style.backgroundColor = color;
            this.elements.arrow.style.borderTopColor = color;
        }
    },

    createIcon: function() {
        this.elements = {};
        this.elements.main = L.DomUtil.create('div');
        this.elements.container = L.DomUtil.create('div', 'icon_container', this.elements.main);
        this.elements.arrow = L.DomUtil.create('div', 'icon_arrow', this.elements.main);
        this.elements.img = L.DomUtil.create('img', null, this.elements.container);
        var src = this._getIconUrl('icon');
        if(src) {
            this.elements.img.src = src;
        }
        this._setColor();
        this._setIconStyles(this.elements.main, 'icon');
        return this.elements.main;
    }

});

L.ChickpeaIcon.Circle = L.ChickpeaIcon.extend({
    initialize: function(map, options) {
        var default_options = {
            iconAnchor: new L.Point(6, 12),
            popupAnchor: new L.Point(0, -12),
            className: "chickpea-circle-icon"
        };
        options = L.Util.extend({}, default_options, options);
        L.ChickpeaIcon.prototype.initialize.call(this, map, options);
    },

    _setColor: function() {
        if(this.feature) {
            var color = this.feature.getColor();
            this.elements.main.style.backgroundColor = color;
        }
    },

    createIcon: function() {
        this.elements = {};
        this.elements.main = L.DomUtil.create('div');
        this.elements.main.innerHTML = "&nbsp;";
        this._setColor();
        this._setIconStyles(this.elements.main, 'icon');
        return this.elements.main;
    }

});