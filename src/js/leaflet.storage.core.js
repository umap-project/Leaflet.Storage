/* Poor man pub/sub handler, enough for now */

L.StorageSingleton = L.Class.extend({
    includes: L.Mixin.Events,
    version: '0.4.0'
});
L.Storage = new L.StorageSingleton();
L.S = L.Storage;
L.Storage.Map = L.Map.extend({});

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
        options[name] = value == "1" || value == "true";
    }
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
