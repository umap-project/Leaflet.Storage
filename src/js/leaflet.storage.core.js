/* Poor man pub/sub handler, enough for now */

L.StorageSingleton = L.Class.extend({
    includes: L.Mixin.Events,
    version: '0.4.0'
});
L.Storage = new L.StorageSingleton();
L.S = L.Storage;
L.Storage.Map = L.Map.extend({});


/*
* Utils
*/
L.Util.queryString = function (name, fallback) {
    var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
    var qs = window.location.search.slice(1).split('&'), qa = {};
    for(var i in qs) {
        var key = qs[i].split('=');
        if (!key) continue;
        qa[decode(key[0])] = key[1] ? decode(key[1]) : 1;
    }
    return qa[name] || fallback;
};

L.Util.booleanFromQueryString = function (name) {
    var value = L.Util.queryString(name);
    return value === "1" || value === "true";
};

L.Util.setFromQueryString = function (options, name) {
    var value = L.Util.queryString(name);
    if (typeof value !== "undefined") {
        options[name] = value;
    }
};

L.Util.setBooleanFromQueryString = function (options, name) {
    var value = L.Util.queryString(name);
    if (typeof value !== "undefined") {
        options[name] = value == "1" || value == "true";
    }
};
L.Util.toHTML = function (r) {
    var ii;

    // detect newline format
    var newline = r.indexOf('\r\n') != -1 ? '\r\n' : r.indexOf('\n') != -1 ? '\n' : '';

    // Escape tags
    r = r.replace(/</gm, '&lt;');


    // headings and hr
    r = r.replace(/^### (.*)=*/gm, '<h5>$1</h5>');
    r = r.replace(/^## (.*)=*/gm, '<h4>$1</h4>');
    r = r.replace(/^# (.*)=*/gm, '<h3>$1</h3>');
    r = r.replace(/^[-*][-*][-*]+/gm, '<hr>');

    // bold, italics
    r = r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    r = r.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // unordered lists
    r = r.replace(/^\*\* (.*)/gm, '<ul><ul><li>$1</li></ul></ul>');
    r = r.replace(/^\* (.*)/gm, '<ul><li>$1</li></ul>');
    for (ii = 0; ii < 3; ii++) r = r.replace(new RegExp('</ul>' + newline + '<ul>', 'g'), newline);

    // links
    r = r.replace(/(\[\[http)/g, '[[h_t_t_p');  // Escape for avoiding clash between [[http://xxx]] and http://xxx
    r = r.replace(/(https?[^ ]*)/g, '<a target="_blank" href="$1">$1</a>');
    r = r.replace(/\[\[(h_t_t_ps?:[^\]|]*?)\]\]/g, '<a target="_blank" href="$1">$1</a>');
    r = r.replace(/\[\[(h_t_t_ps?:[^|]*?)\|(.*?)\]\]/g, '<a target="_blank" href="$1">$2</a>');
    r = r.replace(/\[\[([^\]|]*?)\]\]/g, '<a href="$1">$1</a>');
    r = r.replace(/\[\[([^|]*?)\|(.*?)\]\]/g, '<a href="$1">$2</a>');
    r = r.replace(/(h_t_t_p)/g, 'http');

    // images
    r = r.replace(/{{([^\]|]*?)}}/g, '<img src="$1">');
    r = r.replace(/{{([^|]*?)\|(.*?)}}/g, '<img src="$1" alt="$2">');

    // video
    r = r.replace(/<<(.*?)>>/g, '<embed class="video" src="$1" allowfullscreen="true" allowscriptaccess="never" type="application/x-shockwave/flash"></embed>');

    // Preserver line breaks
    if (newline) r = r.replace(new RegExp(newline, 'g'), '<br>' + newline);

    return r;
};

L.DomUtil.add = function (tagName, className, container, content) {
    var el = L.DomUtil.create(tagName, className, container);
    if (content) {
        el.innerHTML = content;
    }
    return el;
};

L.DomUtil.createFieldset = function (container, legend) {
    var fieldset = L.DomUtil.create('fieldset', 'toggle', container);
    L.DomUtil.add('legend', 'style_options_toggle', fieldset, legend);
    return fieldset;
};

/*
* Global events
*/
L.S._onKeyDown = function (e) {
    var key = e.keyCode,
        ESC = 27;
    if (key == ESC) {
        L.S.fire('ui:end');
    }
};
L.DomEvent.addListener(document, 'keydown', L.S._onKeyDown, L.S);
