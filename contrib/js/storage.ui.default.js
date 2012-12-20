/*
* Demonstration on how listen to L.Storage notification events.
* Mainly for tests.
*/

/*
* Modals
*/
L.Storage.on('ui:start', function (e) {
    var div = L.DomUtil.get('storage-ui-container');
    var body = document.getElementsByTagName('body')[0];
    div.innerHTML = "";
    div.innerHTML = e.data.html;
    L.DomUtil.addClass(body, 'storage-ui');
    var close_link = L.DomUtil.create('a', 'storage-close-link', div);
    close_link.innerHTML = "&times;";
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
    var body = document.getElementsByTagName('body')[0];
    div.innerHTML = "";
    L.DomUtil.removeClass(body, 'storage-ui');
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
    var close_link = L.DomUtil.create('a', 'storage-close-link', div);
    close_link.innerHTML = "&times;";
    var close = function (e) {
        div.innerHTML = "";
        L.DomUtil.removeClass(body, 'storage-alert');
    };
    L.DomEvent
        .on(close_link, 'click', L.DomEvent.stopPropagation)
        .on(close_link, 'click', L.DomEvent.preventDefault)
        .on(close_link, 'click', close);
    window.setTimeout(close, 3000);
});
