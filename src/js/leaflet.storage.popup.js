L.S.Popup = L.Popup.extend({

    initialize: function (feature) {
        this.feature = feature;
        this.container = L.DomUtil.create('div', 'storage-popup');
        this.format();
        L.Popup.prototype.initialize.call(this, {}, feature);
        this.setContent(this.container);
    },

    hasFooter: function () {
        return this.feature.hasPopupFooter();
    },

    renderTitle: function () {
        var title;
        if (this.feature.getDisplayName()) {
            title = L.DomUtil.create('h3', 'popup-title');
            title.innerHTML = L.Util.escapeHTML(this.feature.getDisplayName());
        }
        return title;
    },

    renderBody: function () {
        var body;
        if (this.feature.properties.description) {
            body = L.DomUtil.create('p');
            body.innerHTML = L.Util.toHTML(this.feature.properties.description);
            var els = body.querySelectorAll('img,iframe');
            for (var i = 0; i < els.length; i++) {
                this.onElementLoaded(els[i]);
            }
        }
        return body;
    },

    renderFooter: function () {
        if (this.hasFooter()) {
            var footer = L.DomUtil.create('ul', 'storage-popup-footer', this.container),
                previous_li = L.DomUtil.create('li', 'previous', footer),
                zoom_li = L.DomUtil.create('li', 'zoom', footer),
                next_li = L.DomUtil.create('li', 'next', footer),
                next = this.feature.getNext(),
                prev = this.feature.getPrevious();
            if (next) {
                next_li.title = L._('Go to «{feature}»', {feature: next.properties.name});
            }
            if (prev) {
                previous_li.title = L._('Go to «{feature}»', {feature: prev.properties.name});
            }
            zoom_li.title = L._('Zoom to this feature');
            L.DomEvent.on(next_li, 'click', function () {
                if (next) {
                    next.bringToCenter({zoomTo: next.getOption('zoomTo')}, function () {next.view(next.getCenter());});
                }
            });
            L.DomEvent.on(previous_li, 'click', function () {
                if (prev) {
                    prev.bringToCenter({zoomTo: prev.getOption('zoomTo')}, function () {prev.view(prev.getCenter());});
                }
            });
            L.DomEvent.on(zoom_li, 'click', function () {
                this.bringToCenter({zoomTo: this.getOption('zoomTo')});
            }, this.feature);
        }
    },

    format: function () {
        var title = this.renderTitle();
        if (title) {
            this.container.appendChild(title);
        }
        var body = this.renderBody();
        if (body) {
            this.bodyContainer = L.DomUtil.add('div', 'storage-popup-content', this.container, body);
        }
        this.renderFooter();
    },

    onElementLoaded: function (el) {
        L.DomEvent.on(el, 'load', function () {
            this._updateLayout();
            this._updatePosition();
            this._adjustPan();
        }, this);
    }

});

L.S.Popup.Large = L.S.Popup.extend({
    options: {
        maxWidth: 500,
        className: 'storage-popup-large'
    }
});

L.S.Popup.Table = L.S.Popup.extend({

    formatRow: function (key, value) {
        if (value.indexOf('http') === 0) {
            value = '<a href="' + value + '" target="_blank">' + value + '</a>';
        }
        return value;
    },

    addRow: function (container, key, value) {
        var tr = L.DomUtil.create('tr', '', container);
        L.DomUtil.add('th', '', tr, key);
        L.DomUtil.add('td', '', tr, this.formatRow(key, value));
    },

    renderBody: function () {
        var table = L.DomUtil.create('table');

        for (var key in this.feature.properties) {
            if (typeof this.feature.properties[key] === 'object' || key === 'name') {
                continue;
            }
            // TODO, manage links (url, mailto, wikipedia...)
            this.addRow(table, key, L.Util.escapeHTML(this.feature.properties[key]).trim());
        }
        return table;
    }

});

L.S.Popup.table = L.S.Popup.Table;  // backward compatibility

L.S.Popup.GeoRSSImage = L.S.Popup.extend({

    options: {
        minWidth: 300,
        maxWidth: 500,
        className: 'storage-popup-large storage-georss-image'
    },

    renderBody: function () {
        var container = L.DomUtil.create('a');
        container.href = this.feature.properties.link;
        container.target = '_blank';
        if (this.feature.properties.img) {
            var img = L.DomUtil.create('img', '', container);
            img.src = this.feature.properties.img;
            // Sadly, we are unable to override this from JS the clean way
            // See https://github.com/Leaflet/Leaflet/commit/61d746818b99d362108545c151a27f09d60960ee#commitcomment-6061847
            img.style.maxWidth = this.options.maxWidth + 'px';
            img.style.maxHeight = this.options.maxWidth + 'px';
            this.onElementLoaded(img);
        }
        return container;
    }

});

L.S.Popup.GeoRSSLink = L.S.Popup.extend({

    options: {
        className: 'storage-georss-link'
    },

    renderBody: function () {},
    renderTitle: function () {
        var title = L.S.Popup.prototype.renderTitle.call(this),
            a = L.DomUtil.add('a');
        a.href = this.feature.properties.link;
        a.target = '_blank';
        a.appendChild(title);
        return a;
    }
});

L.S.Popup.SimplePanel = L.S.Popup.extend({

    update: function () {
        L.S.fire('ui:start', {data: {html: this._content}});
    },
    onRemove: function (map) {
        L.S.fire('ui:end');
        L.S.Popup.prototype.onRemove.call(this, map);
    },
    _initLayout: function () {this._container = L.DomUtil.create('span');},
    _updateLayout: function () {},
    _updatePosition: function () {},
    _adjustPan: function () {}
});
