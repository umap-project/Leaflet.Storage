casper.start('http://localhost:1337');

casper.assertI18n = function (string, data, expected, message) {
    var translated = this.evaluate(function (string, data) {
        return L.S._(string, data);
    }, {string: string, data: data});
    this.test.assertEquals(translated, expected, message || string + " > translated to > " + translated);
};

casper.then(function () {
    this.page.injectJs('./src/locale/fr.js');
    this.evaluate(function () {
        L.S.setLocale("fr");
    });
});

casper.then(function () {
    this.assertI18n("Feature updated with success!", null, "POI mis à jour avec succès!");
    this.assertI18n("Unkown geometry.type: {type}", {type: "MultiPolygon"}, "Type de géométrie inconnu: MultiPolygon");
    this.assertI18n("sentence not translated", null, "sentence not translated");
    // Missing value for variable
    this.assertI18n("Unkown geometry.type: {type}", null, "Type de géométrie inconnu: {type}");
});

casper.then(function () {
    // Set a non registered locale
    this.evaluate(function () {
        L.S.setLocale("de");
    });
    this.assertI18n("Feature updated with success!", null, "Feature updated with success!");
});

casper.run(function() {
    this.test.done();
});