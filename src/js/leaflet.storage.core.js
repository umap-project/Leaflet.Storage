/* Poor man pub/sub handler, enough for now */

L.StorageSingleton = L.Class.extend({
    includes: L.Mixin.Events,
    version: '0.1.0'
});
L.Storage = new L.StorageSingleton();
L.S = L.Storage;

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

/*
* i18n
*/
L.S.locales = {};
L.S.locale = null;
L.S.registerLocale = function registerLocale(code, locale) {
    L.S.locales[code] = L.Util.extend({}, L.S.locales[code], locale);
};
L.S.setLocale = function setLocale(code) {
    L.S.locale = code;
};
L.S.i18n = L.S._ = function translate(string, data) {
    if (L.S.locale && L.S.locales[L.S.locale] && L.S.locales[L.S.locale][string]) {
        string = L.S.locales[L.S.locale][string];
    }
    try {
        // Do not fail if some data is missing
        // a bad translation should not break the app
        string = L.Util.template(string, data);
    }
    catch (err) {/*pass*/}

    return string;
};
