/* Poor man pub/sub handler, enough for now */

L.ChickpeaEvents = L.Class.extend({
    includes: L.Mixin.Events
});
L.Chickpea = new L.ChickpeaEvents();
