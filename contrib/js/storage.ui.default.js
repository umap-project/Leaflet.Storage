/*
* Demonstration on how listen to L.Storage notification events.
* Mainly for tests.
*/

/*
* Modals
*/
L.Storage.on('ui:start', function (e) {
    var container = L.DomUtil.get('storage-ui-container');
    // We reset all because we can't know which class has been added
    // by previous ui processes...
    container.className = '';
    container.innerHTML = '';
    var actionsContainer = L.DomUtil.create('ul', 'toolbox', container);
    var body = L.DomUtil.create('div', 'body', container);
    if (e.data.html.nodeType && e.data.html.nodeType === 1) {
        body.appendChild(e.data.html);
    }
    else {
        body.innerHTML = e.data.html;
    }
    L.DomUtil.addClass(document.body, 'storage-ui');
    var closeLink = L.DomUtil.create('li', 'storage-close-link', actionsContainer);
    L.DomUtil.add('i', 'storage-close-icon', closeLink);
    var label = L.DomUtil.create('span', '', closeLink);
    label.title = label.innerHTML = L._('Close');
    if (e.actions) {
        for (var i = 0; i < e.actions.length; i++) {
            actionsContainer.appendChild(e.actions[i]);
        }
    }
    if (e.cssClass) {
        L.DomUtil.addClass(container, e.cssClass);
    }
    L.Storage.fire('ui:ready');
    var close = function () {
        L.Storage.fire('ui:end');
    };
    L.DomEvent.on(closeLink, 'click', close);
});

L.Storage.on('ui:end', function () {
    var div = L.DomUtil.get('storage-ui-container');
    div.innerHTML = '';
    L.DomUtil.removeClass(document.body, 'storage-ui');
    L.Storage.fire('ui:closed');
});

/*
* Alerts
*/
var UI_ALERTS = Array();
var UI_ALERT_ID =  null;
L.Storage.on('ui:alert', function (e) {
    var pop = function (e) {
        if(!e) {
            if (UI_ALERTS.length) {
                e = UI_ALERTS.pop();
            } else {
                return;
            }
        }
        var div = L.DomUtil.get('storage-alert-container'),
            timeoutID,
            level_class = e.level && e.level == 'info'? 'info': 'error';
        div.innerHTML = '';
        div.innerHTML = e.content;
        L.DomUtil.addClass(document.body, 'storage-alert');
        L.DomUtil.addClass(div, level_class);
        var close = function () {
            if (timeoutID !== UI_ALERT_ID) { return;}  // Another alert has been forced
            div.innerHTML = '';
            L.DomUtil.removeClass(document.body, 'storage-alert');
            L.DomUtil.removeClass(div, level_class);
            if (timeoutID) {
                window.clearTimeout(timeoutID);
            }
            pop();
        };
        if (e.actions) {
            var action, el;
            for (var i = 0; i < e.actions.length; i++) {
                action = e.actions[i];
                el = L.DomUtil.element('a', {'className': 'storage-action'}, div);
                el.href = '#';
                el.innerHTML = action.label;
                L.DomEvent.on(el, 'click', L.DomEvent.stop)
                          .on(el, 'click', close);
                if (action.callback) {
                    L.DomEvent.on(el, 'click', action.callback, action.callbackContext || this);
                }
            }
        }
        var closeLink = L.DomUtil.create('a', 'storage-close-link', div);
        closeLink.href = '#';
        L.DomUtil.add('i', 'storage-close-icon', closeLink);
        var label = L.DomUtil.create('span', '', closeLink);
        label.title = label.innerHTML = L._('Close');
        L.DomEvent.on(closeLink, 'click', L.DomEvent.stop)
                  .on(closeLink, 'click', close);
        UI_ALERT_ID = timeoutID = window.setTimeout(close, e.duration || 3000);
    };
    if (L.DomUtil.hasClass(document.body, 'storage-alert')) {
        UI_ALERTS.push(e);
    } else {
        pop(e);
    }
});

/*
* Tooltips
*/
L.Storage.on('ui:tooltip:init', function (e) {
    var tooltip = L.DomUtil.get('storage-tooltip-container'),
        map = e.map,
        ID;

    var close = function (id) {
        if (id && id !== ID) return;
        tooltip.innerHTML = '';
        L.DomUtil.removeClass(document.body, 'storage-tooltip');
    };

    var setFixedPosition = function () {
        var left = map._container.offsetLeft + (map._container.clientWidth / 2) - (tooltip.clientWidth / 2),
            top = map._container.offsetTop + 5,
            point = L.point(left, top);
        L.DomUtil.setPosition(tooltip, point);
    };

    L.Storage.on('ui:tooltip', function (e) {
        ID = Math.random();
        var id = ID;
        L.DomUtil.addClass(document.body, 'storage-tooltip');
        setFixedPosition();
        tooltip.innerHTML = e.content;
        function closeIt () {close(id);}
        if (e.attachTo) {
            L.DomEvent.on(e.attachTo, 'mouseout', closeIt);
        }
        if (e.duration !== Infinity) {
            window.setTimeout(closeIt, e.duration || 3000);
        }
    });

    L.Storage.on('ui:tooltip:abort', function () {
        close();
    });

});
