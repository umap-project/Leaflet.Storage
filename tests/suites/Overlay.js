casper.start('http://localhost:8007');

var category_edit_path = '/map/42/category/edit/62/';

casper.then(function () {
    this.toggleEditButton();
    this.test.assertExists('a#edit_overlay_62', 'Edit overlay button exists');
    this.test.assertExists('input.leaflet-control-layers-selector[type="checkbox"]', 'Display overlay checkbox exists');
    this.test.assertElementsCount('input.leaflet-control-layers-selector[type="checkbox"]', 1);
    this.server.watchPath(category_edit_path, {filePath: 'map_category_update_GET'});
    this.getCategoryEditForm(62);
});

casper.then(function(){
    this.test.assertExists('form#category_edit');
    this.test.assertExists('form#category_edit input[type="submit"]');
    new_name = "Name 1234 Tadam";
    this.fill('form#category_edit', {name: new_name});
    this.server.watchPath(category_edit_path, {filePath: 'map_category_update_POST'});
    this.server.watchRequest(category_edit_path);
});

casper.thenClick('form#category_edit input[type="submit"]', function () {
    var request = this.server.watchedRequests[category_edit_path];
    this.test.assertEqual(request.method, 'POST', 'Category update infos form submit a POST');
    this.test.assertEqual(request.post.name, new_name, 'Category new name has been submited');
    this.server.unwatchRequest(category_edit_path);
    this.server.unwatchPath(category_edit_path);
});

/* ******************* */
/*  Icon class change  */
/* ******************* */
casper.then(function () {
    this.test.assertExists('div.storage-div-icon', "Current marker has Default icon class");
    // Get edit form again
    this.server.watchPath(category_edit_path, {filePath: 'map_category_update_GET'});
    this.getCategoryEditForm(62);
});

casper.then(function () {
    // Return a new icon class: Circle
    this.server.watchPath(category_edit_path, {content: '{"category": {"icon_class": "Circle","name": "Elephants","color": "Pink","display_on_load": true,"pk": 62,"pictogram_url": null}}'});
});

casper.thenClick('form#category_edit input[type="submit"]', function () {
    this.test.assertNotExists('div.storage-div-icon', "Current marker has not Default icon class");
    this.test.assertExists('div.storage-circle-icon', "Current marker has Circle icon class");
});

// casper.then(function () {
// });


/* ******************* */
/*        Delete       */
/* ******************* */

casper.then(function () {
    // Get edit form again
    this.server.watchPath(category_edit_path, {filePath: 'map_category_update_GET'});
    this.getCategoryEditForm(62);
});

casper.then(function () {
    this.test.assertExists('a#delete_category_button');
    category_delete_path = '/map/42/category/delete/62/';
    this.server.watchPath(category_delete_path, {filePath: 'map_category_delete_GET'});
});

casper.thenClick('a#delete_category_button', function () {
    this.test.assertExists('form#category_delete');
    this.test.assertExists('form#category_delete input[type="submit"]');
    this.server.watchPath(category_delete_path, {filePath: 'map_category_delete_POST'});
});

casper.thenClick('form#category_delete input[type="submit"]', function () {
    this.test.assertNotExists('input.leaflet-control-layers-selector[type="checkbox"]', 'Display overlay checkbox does not exist after category has been deleted');
    this.test.assertNotExists('div.icon_container', 'icon container is not found after category has been deleted');
});

casper.run(function() {
    this.test.done();
});