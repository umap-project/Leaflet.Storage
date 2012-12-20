casper.start('http://localhost:1337');

casper.then(function() {
    // Check page state on load
    this.test.assertTitle('My test page', 'title is the one expected');
    this.test.assertExists('div[id="map"]', 'map div is found');
    this.test.assertExists('a.leaflet-control-edit-toggle', 'toggle edit link is found');
    this.test.assertNotVisible('a.update-map-infos', 'update map infos button is not visibile on load');
    this.test.assertExists('div.leaflet-control-layers', 'category control is found');
    this.test.assertExists('input.leaflet-control-layers-selector', 'category selector input is found');
    this.test.assertExists('div.icon_container', 'icon container is found on load');
});

casper.then(function () {
    // Uncheck category
    this.clickLabel(' POIs'); // There is a space, #TODO check why
    this.test.assertNotExists('div.icon_container', 'icon container is not found when category unchecked');
});

casper.then(function () {
    // Edit map infos
    this.toggleEditButton();
    this.test.assertVisible('a.update-map-infos', 'update map infos button is visibile when edit enabled');
    this.server.watchPath('/map/42/update/metadata/', 'map_update_metadata_GET');
});

casper.thenClick('a.update-map-infos', function () {
    this.test.assertExists('form[id="map_edit"]');
    this.test.assertExists('form[id="map_edit"] input[type="submit"]');
});

casper.then(function () {
    path = '/map/42/update/metadata/';
    this.server.watchRequest(path);
    this.server.watchPath(path, {data: '{"redirect": "/"}'});
    new_name = 'A new new name';
    this.fill('form#map_edit', {name: new_name});
});

casper.thenClick('form[id="map_edit"] input[type="submit"]', function () {
    // Submit edit form
    var request = this.server.watchedRequests[path];
    this.test.assertEqual(request.method, 'POST', 'Map update infos form submit a POST');
    this.test.assertEqual(request.post.name, new_name, 'Map new name has been submited');
    this.server.unwatchPath(path);
    this.server.unwatchRequest(path);
    this.server.watchPath('/map/42/update/metadata/', 'map_update_metadata_GET');
});

casper.thenClick('a.update-map-infos', function () {
    // Request again Map edit form
    this.test.assertExists('form[id="map_edit"]');
    this.test.assertExists('a#delete_map_button');
    delete_path = "/map/42/delete/";
    this.server.watchPath(delete_path, 'map_delete_GET');
});

casper.thenClick('a#delete_map_button', function () {
    // Click on delete link and assert form has been populated
    this.test.assertExists('form#map_delete');
    this.test.assertExists('form#map_delete input[type="submit"]');
    this.server.watchPath(delete_path, {data: '{"redirect": "/?redirected"}'});
});

casper.thenClick('form#map_delete input[type="submit"]', function () {
    this.test.assertUrlMatch(/\?redirected/, "Redirection has been done after map delete");
});

casper.run(function() {
    this.test.done();
});
