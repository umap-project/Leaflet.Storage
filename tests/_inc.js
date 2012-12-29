// Paths must be relative to the Makefile dir (Leaflet.Storage root).
require('./tests/casperserver/casperserver.js').create(casper, {
    port: 8007,
    fsPath: './tests/responses/'
});

casper.server.watchPath('^(/src/|/reqs/|/contrib/)', {
    filePath: function (request) {
        return '.' + request.url;
    },
    permanent: true
});

casper.toggleEditButton = function () {
    this.click('a.leaflet-control-edit-toggle');
};

casper.test.assertElementsCount = function (selector, expected, message) {
    var actual = this.casper.evaluate(function(selector) {
        return __utils__.findAll(selector).length;
    }, selector);
    return this.assert(this.testEquals(actual, expected), message, {
        type: 'assertElementsCount',
        standard: f('"%s" elements found with selector "%s"', expected, selector),
        values: {
            selector: selector,
            actual: actual,
            expected: expected
         }
    });
};