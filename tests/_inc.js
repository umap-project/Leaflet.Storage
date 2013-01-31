// Paths must be relative to the Makefile dir (Leaflet.Storage root).
require('./tests/casperserver/casperserver.js').create(casper, {
    port: 8007,
    responsesDir: './tests/responses/'
});

casper.server.watchPath('^(/src/|/reqs/|/contrib/)', {
    filePath: function (request) {
        return '.' + request.url;
    },
    permanent: true
});

casper.on("page.error", function(msg, trace) {
    this.echo("Error: " + msg, "ERROR");
    require('utils').dump(trace);
});

casper.toggleEditButton = function () {
    this.click('a.leaflet-control-edit-toggle');
};

casper.getCategoryEditForm = function (id) {
    this.mouseEvent('mouseover', 'div.leaflet-control-layers');
    this.test.assertVisible('a#edit_overlay_' + id, 'Edit overlay button is visibile when edit enabled');
    this.click('a#edit_overlay_' + id);
};

casper.categoryResponsePOST = function (settings) {
    var response = {
        "category": {
            "icon_class": "Default",
            "name": "Elephants",
            "display_on_load": true,
            "pk": 62,
            "pictogram_url": null,
            "options": {
                "opacity": null,
                "weight": null,
                "fillColor": "",
                "color": "",
                "stroke": true,
                "smoothFactor": null,
                "dashArray": "",
                "fillOpacity": null,
                "fill": true
            }
        }
    };
    for (var key in settings) {
        if (typeof response[key] !== "undefined") {
            response.category[key] = settings[key];
        }
        else {
            response.category.options[key] = settings[key];
        }
    }
    return {content: JSON.stringify(response)};
};

casper.editCategory = function (id, vals) {
    var path = '/map/42/category/edit/' + id +'/';
    this.server.watchPath(path, {filePath: 'map_category_update_GET'});
    this.getCategoryEditForm(id);
    this.then(function () {
        this.server.watchPath(path, this.categoryResponsePOST(vals));
        this.fill('form#category_edit', vals);
        this.click('form#category_edit input[type="submit"]');
    });
};

casper.polygonResponsePOST = function (settings) {
    var response = {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[2.7685546875, 55.696163893908825], [1.483154296875, 55.19768334019969], [3.251953125, 53.85252660044951], [7.3388671875, 54.91451400766527], [5.262451171875, 55.59076338488528], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825]]]
        },
        "type": "Feature",
        "id": 76,
        "properties": {
            "category_id": 62,
            "name": "test poly simple",
            "options": {
                "opacity": null,
                "weight": null,
                "color": null,
                "stroke": true,
                "smoothFactor": null,
                "dashArray": null,
                "fillColor": null,
                "fill": null,
                "fillOpacity": null
            },
            "icon": {}
        }
    };
    for (var key in settings) {
        if (typeof response.properties[key] !== "undefined") {
            response.properties[key] = settings[key];
        }
        else {
            response.properties.options[key] = settings[key];
        }
    }
    return {content: JSON.stringify(response)};
};

casper.editPolygon = function (id, selector, vals) {
    var path = '/map/42/polygon/edit/' + id +'/';
    this.server.watchPath(path, {filePath: 'map_polygon_update_GET'});
    this.then(function () {
        this.mouseEvent('dblclick', selector);
    });
    this.then(function () {
        this.server.watchPath(path, this.polygonResponsePOST(vals));
        this.fill('form#feature_form', vals);
        this.click('form#feature_form input[type="submit"]');
    });
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

casper.test.assertAttributes = function (selector, expected, message) {
    var actual,
        getAttr = function (selector, name) {
            return __utils__.findOne(selector).getAttribute(name);
        };
    for (var name in expected) {
        actual = this.casper.evaluate(getAttr, {selector: selector, name: name});
        this.assert(actual == expected[name], message, {
            type: 'assertAttributes',
            standard: f('"%s" has attribute "%s" with value "%s"', selector, name, expected[name]),
            values: {
                selector: selector,
                name: name,
                value: expected[name]
             }
        });
    }
};
