/* Poor man pub/sub handler, enough for now */

L.StorageSingleton = L.Class.extend({
    includes: L.Mixin.Events,
    version: '0.2.0'
});
L.Storage = new L.StorageSingleton();
L.S = L.Storage;
L.Storage.Map = L.Map.extend({});

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
