casper.start('http://localhost:8007');

var datalayer_edit_path = '/map/42/datalayer/edit/62/';

casper.then(function () {
    this.toggleEditButton();
    this.test.assertExists('.leaflet-control-browse #browse_data_toggle_62.on', 'The datalayer 62 is active');
    this.test.assertExists('span#edit_datalayer_62', 'Edit datalayer button exists');
    this.test.assertExists('.leaflet-control-browse span.layer-toggle', 'Toggle datalayer button exists');
    this.test.assertElementsCount('.leaflet-control-browse span.layer-toggle', 1);
    this.server.watchPath(datalayer_edit_path, {filePath: 'map_datalayer_update_GET'});
    this.getDataLayerEditForm(62);
});

casper.then(function(){
    this.test.assertExists('form#datalayer_edit');
    this.test.assertExists('form#datalayer_edit input[type="submit"]');
    new_name = "Name 1234 Tadam";
    this.fill('form#datalayer_edit', {name: new_name});
    this.server.watchPath(datalayer_edit_path, {filePath: 'map_datalayer_update_POST'});
    this.server.watchRequest(datalayer_edit_path);
});

casper.thenClick('form#datalayer_edit input[type="submit"]', function () {
    var request = this.server.watchedRequests[datalayer_edit_path];
    this.test.assertEqual(request.method, 'POST', 'Layer update infos form submit a POST');
    this.test.assertEqual(request.post.name, new_name, 'Layer new name has been submited');
    this.server.unwatchRequest(datalayer_edit_path);
    this.server.unwatchPath(datalayer_edit_path);
});

/* ******************* */
/*  Icon class change  */
/* ******************* */
casper.then(function () {
    this.test.assertExists('div.storage-div-icon', "Current marker has Default icon class");
});

casper.then(function () {
    // Change icon
    response = {
        "crs": null,
        "type": "FeatureCollection",
        "features": [{
            "geometry": {
                "type": "Point",
                "coordinates": [-0.274658203125, 52.57634993749885]
            },
            "type": "Feature",
            "id": 1807,
            "properties": {"options": {}, "datalayer_id": 62, "name": "test", "icon": {"url": null, "class": "Circle"}}
        }]
    };
    this.server.watchPath('/feature/json/datalayer/62/', {content: JSON.stringify(response)});
});

casper.then(function () {
    // Return a new icon class: Circle
    this.editDataLayer(62, {icon_class: "Circle", color: "DarkRed"});
});

casper.then(function () {
    // this.server.watchPath(datalayer_edit_path, {content: '{"datalayer": {"icon_class": "Circle","name": "Elephants","color": "Pink","display_on_load": true,"pk": 62,"pictogram_url": null}}'});
    this.test.assertNotExists('div.storage-div-icon', "Current marker has not Default icon class");
    this.test.assertExists('div.storage-circle-icon', "Current marker has Circle icon class");
});


/* ******************* */
/*        Delete       */
/* ******************* */

casper.then(function () {
    // Get edit form again
    this.server.watchPath(datalayer_edit_path, {filePath: 'map_datalayer_update_GET'});
    this.getDataLayerEditForm(62);
});

casper.then(function () {
    this.test.assertExists('a#delete_datalayer_button');
    datalayer_delete_path = '/map/42/datalayer/delete/62/';
    this.server.watchPath(datalayer_delete_path, {filePath: 'map_datalayer_delete_GET'});
});

casper.thenClick('a#delete_datalayer_button', function () {
    this.test.assertExists('form#datalayer_delete');
    this.test.assertExists('form#datalayer_delete input[type="submit"]');
    this.server.watchPath(datalayer_delete_path, {filePath: 'map_datalayer_delete_POST'});
});

casper.thenClick('form#datalayer_delete input[type="submit"]', function () {
    this.test.assertNotExists('.leaflet-control-browse .layer-toggle', 'Toggle datalayer button does not exist after datalayer has been deleted');
    this.test.assertNotExists('div.icon_container', 'icon container is not found after datalayer has been deleted');
});

casper.run(function() {
    this.test.done();
});