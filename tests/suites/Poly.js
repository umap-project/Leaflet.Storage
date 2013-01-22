casper.start('http://localhost:8007');

casper.then(function () {
    // One Polyline, one Polygon, see responses/feature_json_category_62
    this.test.assertElementsCount("path", 2);
    this.test.assertExists('path[fill="none"]'); // Polyline
    this.test.assertExists('path[fill="DarkBlue"]'); // Polygon
    // this.debugHTML("div.leaflet-overlay-pane");
    this.toggleEditButton();
});

casper.then(function () {
    this.editCategory(62, {color: "DarkRed", opacity: 0.8});
});

casper.then(function () {
    this.test.assertExists('path[fill="DarkRed"]', "Polygon fillcolor has changed");
    this.test.assertExists('path[fill="none"]', "Polyline fill color has not been set");
    this.test.assertAttributes('path[fill="DarkRed"]', {"stroke-opacity": 0.8});
    this.test.assertAttributes('path[fill="none"]', {"stroke-opacity": 0.8});
});

casper.then(function () {
    this.editPolygon(76, 'path[fill="DarkRed"]', {color: "DarkGreen", opacity: 0.7});
});

casper.then(function () {
    this.test.assertExists('path[fill="DarkGreen"]', "Polygon fillcolor has changed");
    this.test.assertExists('path[fill="none"]', "Polyline fill color has not been set");
    this.test.assertAttributes('path[fill="DarkGreen"]', {"stroke-opacity": 0.7});
});

casper.then(function () {
    // Add color for Polygon
    response = {
        "crs": null,
        "type": "FeatureCollection",
        "features": [
        {
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[11.25, 53.585983654559804], [10.1513671875, 52.9751081817353], [12.689208984375, 52.16719363541221], [14.084472656249998, 53.199451902831555], [12.63427734375, 53.61857936489517], [11.25, 53.585983654559804], [11.25, 53.585983654559804]]]
            },
            "type": "Feature",
            "id": 76,
            "properties": {"options": {"color": "yellow"}, "category_id": 62, "name": "test poly clickeabl"}
        }]
    };
    this.server.watchPath('/feature/json/category/62/', {content: JSON.stringify(response)});
});

casper.then(function () {
    this.editCategory(62, {color: "blue", opacity: 0.3});
});

casper.then(function () {
    this.test.assertExists('path[fill="yellow"]', "Polygon fillcolor has not been overrided by category color");
    this.test.assertAttributes('path[fill="yellow"]', {"stroke-opacity": 0.3}, "Opacity has been set from category");
});

casper.run(function() {
    this.test.done();
});