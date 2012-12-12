/* Poor man pub/sub handler, enough for now */

L.StorageSingleton = L.Class.extend({
    includes: L.Mixin.Events
});
L.Storage = new L.StorageSingleton();
L.S = L.Storage;
