L.S.Popup = L.Popup.extend({

    initialize: function (feature) {
        this.feature = feature;
        this.container = L.DomUtil.create('div', '');
        this.format();
        L.Popup.prototype.initialize.call(this, {}, feature);
        this.setContent(this.container);
    },

    hasFooter: function () {
        return this.feature.hasPopupFooter();
    },

    renderTitle: function () {
        if (this.feature.getDisplayName()) {
            L.DomUtil.add('h3', 'popup-title', this.container, L.Util.escapeHTML(this.feature.getDisplayName()));
        }
    },

    renderBody: function () {
        if (this.feature.properties.description) {
            L.DomUtil.add('p', '', this.bodyContainer, L.Util.toHTML(this.feature.properties.description));
        }
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
                next_li.title = L._("Go to «{feature}»", {feature: next.properties.name});
            }
            if (prev) {
                previous_li.title = L._("Go to «{feature}»", {feature: prev.properties.name});
            }
            zoom_li.title = L._("Zoom to this feature");
            L.DomEvent.on(next_li, 'click', function (e) {
                if (next) {
                    next.bringToCenter(e, function () {next.view(next.getCenter());});
                }
            });
            L.DomEvent.on(previous_li, 'click', function (e) {
                if (prev) {
                    prev.bringToCenter(e, function () {prev.view(prev.getCenter());});
                }
            });
            L.DomEvent.on(zoom_li, 'click', function (e) {
                this.map._zoom = 16;  // Do not hardcode this
                this.bringToCenter();
            }, this.feature);
        }
    },

    format: function () {
        this.renderTitle();
        this.bodyContainer = L.DomUtil.create('div', 'storage-popup-content', this.container);
        this.renderBody();
        this.renderFooter();
    }

});

L.S.Popup.Table = L.S.Popup.extend({

    renderBody: function () {
        var table = L.DomUtil.create('table', '', this.bodyContainer);

        var addRow = function (key, value) {
            var tr = L.DomUtil.create('tr', '', table);
            L.DomUtil.add('th', '', tr, key);
            L.DomUtil.add('td', '', tr, value);
        };

        for (var key in this.feature.properties) {
            if (typeof this.feature.properties[key] === "object" || key === "name") {
                continue;
            }
            // TODO, manage links (url, mailto, wikipedia...)
            addRow(key, L.Util.escapeHTML(this.feature.properties[key]));
        }

    }

});

L.S.Popup.table = L.S.Popup.Table;  // backward compatibility
