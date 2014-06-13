/*
* Demonstration on how listen to L.Storage notification events.
* Mainly for tests.
*/

/*
* Modals
*/
L.Storage.on('ui:start', function (e) {
    var div = L.DomUtil.get('storage-ui-container');
    // We reset all because we can't know which class has been added
    // by previous ui processes...
    div.className = "";
    div.innerHTML = "";
    if (e.data.html.nodeType && e.data.html.nodeType === 1) {
        div.appendChild(e.data.html);
    }
    else {
        div.innerHTML = e.data.html;
    }
    L.DomUtil.addClass(document.body, 'storage-ui');
    var close_link = L.DomUtil.create('a', 'storage-close-link', div);
    close_link.innerHTML = "&times;";
    if (e.cssClass) {
        L.DomUtil.addClass(div, e.cssClass);
    }
    L.Storage.fire('ui:ready');
    var close = function (e) {
        L.Storage.fire('ui:end');
    };
    L.DomEvent
        .on(close_link, 'click', L.DomEvent.stopPropagation)
        .on(close_link, 'click', L.DomEvent.preventDefault)
        .on(close_link, 'click', close);
});
L.Storage.on('ui:end', function (e) {
    var div = L.DomUtil.get('storage-ui-container');
    div.innerHTML = "";
    L.DomUtil.removeClass(document.body, 'storage-ui');
    L.Storage.fire('ui:closed');
});

/*
* Alerts
*/
L.Storage.on('ui:alert', function (e) {
    var div = L.DomUtil.get('storage-alert-container');
    var body = document.getElementsByTagName('body')[0];
    div.innerHTML = "";
    div.innerHTML = e.content;
    L.DomUtil.addClass(body, 'storage-alert');
    var level_class = e.level && e.level == "info"? "info": "error";
    L.DomUtil.addClass(div, level_class);
    var close = function (e) {
        div.innerHTML = "";
        L.DomUtil.removeClass(body, 'storage-alert');
        L.DomUtil.removeClass(div, level_class);
    };
    if (e.action) {
        var action = L.DomUtil.element('a', {'className': 'storage-action'}, div);
        action.href = "#";
        action.innerHTML = e.action.label;
        L.DomEvent.on(action, 'click', L.DomEvent.stop)
                  .on(action, 'click', e.action.callback, e.action.callbackContext || this)
                  .on(action, 'click', close);
    }
    var close_link = L.DomUtil.create('a', 'storage-close-link', div);
    close_link.innerHTML = "&times;";
    L.DomEvent
        .on(close_link, 'click', L.DomEvent.stopPropagation)
        .on(close_link, 'click', L.DomEvent.preventDefault)
        .on(close_link, 'click', close);
    window.setTimeout(close, e.duration || 3000);
});

/*
* Tooltips
*/
L.Storage.on('ui:tooltip', function (e) {
    var div = L.DomUtil.get('storage-tooltip-container');
    var body = document.getElementsByTagName('body')[0];
    div.innerHTML = "";
    div.innerHTML = e.content;
    L.DomUtil.addClass(body, 'storage-tooltip');
    var map = L.DomUtil.get('map'),
        left = map.offsetLeft + (map.clientWidth / 2) - (div.clientWidth / 2),
        top = map.offsetTop + 5,
        point = L.point(left, top);
    L.DomUtil.setPosition(div, point);
    var close = function (e) {
        div.innerHTML = "";
        L.DomUtil.removeClass(body, 'storage-tooltip');
    };
    L.DomEvent.on(div, 'mouseover', close);
    window.setTimeout(close, 3000);
});
