/*
* Modals
*/
L.S.UI = L.Evented.extend({

    ALERTS: Array(),
    ALERT_ID:  null,
    TOOLTIP_ID:  null,

    initialize: function (parent) {
        this.parent = parent;
        this.container = L.DomUtil.create('div', 'leaflet-ui-container', this.parent);
        L.DomEvent.disableClickPropagation(this.container);
        L.DomEvent.on(this.container, 'contextmenu', L.DomEvent.stopPropagation);  // Do not activate our custom context menu.
        L.DomEvent.on(this.container, 'mousewheel', L.DomEvent.stopPropagation);
        L.DomEvent.on(this.container, 'MozMousePixelScroll', L.DomEvent.stopPropagation);
        this._panel = L.DomUtil.create('div', '', this.container);
        this._panel.id = 'storage-ui-container';
        this._alert = L.DomUtil.create('div', 'with-transition', this.container);
        this._alert.id = 'storage-alert-container';
        this._tooltip = L.DomUtil.create('div', '', this.container);
        this._tooltip.id = 'storage-tooltip-container';
    },

    resetPanelClassName: function () {
        this._panel.className = 'with-transition';
    },

    openPanel: function (e) {
        this.fire('panel:open');
        // We reset all because we can't know which class has been added
        // by previous ui processes...
        this.resetPanelClassName();
        this._panel.innerHTML = '';
        var actionsContainer = L.DomUtil.create('ul', 'toolbox', this._panel);
        var body = L.DomUtil.create('div', 'body', this._panel);
        if (e.data.html.nodeType && e.data.html.nodeType === 1) body.appendChild(e.data.html);
        else body.innerHTML = e.data.html;
        var closeLink = L.DomUtil.create('li', 'storage-close-link', actionsContainer);
        L.DomUtil.add('i', 'storage-close-icon', closeLink);
        var label = L.DomUtil.create('span', '', closeLink);
        label.title = label.innerHTML = L._('Close');
        if (e.actions) {
            for (var i = 0; i < e.actions.length; i++) {
                actionsContainer.appendChild(e.actions[i]);
            }
        }
        if (e.className) L.DomUtil.addClass(this._panel, e.className);
        if (L.DomUtil.hasClass(this.parent, 'storage-ui')) {
            // Already open.
            this.fire('panel:ready');
        } else {
            L.DomEvent.once(this._panel, 'transitionend', function (e) {
                this.fire('panel:ready');
            }, this);
            L.DomUtil.addClass(this.parent, 'storage-ui');
        }
        L.DomEvent.on(closeLink, 'click', this.closePanel, this);
    },

    closePanel: function () {
        this.resetPanelClassName();
        L.DomUtil.removeClass(this.parent, 'storage-ui');
        this.fire('panel:closed');
    },

    alert: function (e) {
        if (L.DomUtil.hasClass(this.parent, 'storage-alert')) this.ALERTS.push(e);
        else this.popAlert(e);
    },

    popAlert: function (e) {
        var self = this;
        if(!e) {
            if (this.ALERTS.length) e = this.ALERTS.pop();
            else return;
        }
        var timeoutID,
            level_class = e.level && e.level == 'info'? 'info': 'error';
        this._alert.innerHTML = '';
        L.DomUtil.addClass(this.parent, 'storage-alert');
        L.DomUtil.addClass(this._alert, level_class);
        var close = function () {
            if (timeoutID !== this.ALERT_ID) { return;}  // Another alert has been forced
            this._alert.innerHTML = '';
            L.DomUtil.removeClass(this.parent, 'storage-alert');
            L.DomUtil.removeClass(this._alert, level_class);
            if (timeoutID) window.clearTimeout(timeoutID);
            this.popAlert();
        };
        var closeLink = L.DomUtil.create('a', 'storage-close-link', this._alert);
        closeLink.href = '#';
        L.DomUtil.add('i', 'storage-close-icon', closeLink);
        var label = L.DomUtil.create('span', '', closeLink);
        label.title = label.innerHTML = L._('Close');
        L.DomEvent.on(closeLink, 'click', L.DomEvent.stop)
                  .on(closeLink, 'click', close, this);
        L.DomUtil.add('div', '', this._alert, e.content);
        if (e.actions) {
            var action, el;
            for (var i = 0; i < e.actions.length; i++) {
                action = e.actions[i];
                el = L.DomUtil.element('a', {'className': 'storage-action'}, this._alert);
                el.href = '#';
                el.innerHTML = action.label;
                L.DomEvent.on(el, 'click', L.DomEvent.stop)
                          .on(el, 'click', close, this);
                if (action.callback) L.DomEvent.on(el, 'click', action.callback, action.callbackContext || this.map);
            }
        }
        self.ALERT_ID = timeoutID = window.setTimeout(L.bind(close, this), e.duration || 3000);
    },

    fixTooltip: function () {
        var left = this.parent.offsetLeft + (this.parent.clientWidth / 2) - (this._tooltip.clientWidth / 2),
            top = this.parent.offsetTop + 5,
            point = L.point(left, top);
        L.DomUtil.setPosition(this._tooltip, point);
    },

    closeTooltip: function (id) {
        if (id && id !== this.TOOLTIP_ID) return;
        this._tooltip.innerHTML = '';
        L.DomUtil.removeClass(this.parent, 'storage-tooltip');
    },

    tooltip: function (e) {
        this.TOOLTIP_ID = Math.random();
        var id = this.TOOLTIP_ID;
        L.DomUtil.addClass(this.parent, 'storage-tooltip');
        this.fixTooltip();
        this._tooltip.innerHTML = e.content;
        function closeIt () { this.closeTooltip(id); }
        if (e.attachTo) L.DomEvent.on(e.attachTo, 'mouseout', closeIt, this);
        if (e.duration !== Infinity) window.setTimeout(L.bind(closeIt, this), e.duration || 3000);
    },

    abortTooltip: function () {
        this.closeTooltip();
    }

});
