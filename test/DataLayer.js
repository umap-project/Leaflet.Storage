describe('L.DataLayer', function () {
    var path = '/map/99/datalayer/edit/62/';

    before(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith('GET', '/feature/json/datalayer/62/', JSON.stringify(RESPONSES.datalayer62_GET));
        this.map = initMap({storage_id: 99});
        this.server.respond();
        toggleEdit();
    });
    after(function () {
        this.server.restore();
        resetMap();
    });

    describe('#edit()', function () {
        var editButton, form, submitButton;

        it('row in control should be active', function () {
            assert.ok(qs('.leaflet-control-browse #browse_data_toggle_62.on'));
        });

        it('should have edit button', function () {
            editButton = qs('span#edit_datalayer_62');
            assert.ok(editButton);
        });

        it('should have toggle visibility element', function () {
            assert.ok(qs('.leaflet-control-browse span.layer-toggle'));
        });

        it('should exist only one datalayer', function () {
            assert.equal(document.querySelectorAll('.leaflet-control-browse span.layer-toggle').length, 1);
        });

        it('should load a form on edit button click', function () {
            this.server.respondWith('GET', path, JSON.stringify(RESPONSES.map_datalayer_update_GET));
            happen.click(editButton);
            this.server.respond();
            form = qs('form#datalayer_edit');
            submitButton = qs('form#datalayer_edit input[type="submit"]');
            assert.ok(form);
            assert.ok(submitButton);
        });

        it('should make post request on form submit', function () {
            this.server.respondWith('POST', path, JSON.stringify({datalayer: DEFAULT_DATALAYER}));
            happen.click(submitButton);
            this.server.respond();
            request = this.server.getRequest(path, 'POST');
            assert.equal(request.status, 200);
        });

    });

    describe('#iconClassChange()', function () {

        it('should change icon class', function (done) {
            var response = {
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
            this.server.flush();
            this.server.respondWith('GET', '/feature/json/datalayer/62/', JSON.stringify(response));
            this.server.respondWith('GET', path, JSON.stringify(RESPONSES.map_datalayer_update_GET));
            this.server.respondWith('POST', path, JSON.stringify({datalayer: DEFAULT_DATALAYER}));
            happen.click(qs('span#edit_datalayer_62'));
            this.server.respond();
            happen.click(qs('form#datalayer_edit input[type="submit"]'));
            this.server.respond();
            assert.notOk(qs('div.storage-div-icon'));
            assert.ok(qs('div.storage-circle-icon'));
            done();
        });

    });

    describe('#delete()', function () {
        var deleteButton, submitButton,
            deletePath = '/map/99/datalayer/delete/62/';

        it('should have a delete link in update form', function () {
            this.server.respondWith('GET', path, JSON.stringify(RESPONSES.map_datalayer_update_GET));
            happen.click(qs('span#edit_datalayer_62'));
            this.server.respond();
            deleteButton = qs('a#delete_datalayer_button');
            assert.ok(deleteButton);
        });

        it('should ask for confirmation on delete link click', function () {
            this.server.respondWith('GET', deletePath, JSON.stringify(RESPONSES.map_datalayer_delete_GET));
            happen.click(deleteButton);
            this.server.respond();
            assert.ok(qs('form#datalayer_delete'));
            submitButton = qs('form#datalayer_delete input[type="submit"]');
            assert.ok(submitButton);
        });

        it('should delete features on datalayer delete', function () {
            this.server.respondWith('POST', deletePath, JSON.stringify({info: "delete ok"}));
            happen.click(submitButton);
            this.server.respond();
            assert.notOk(qs('div.icon_container'));
        });

        it('should delete layer control row on delete', function () {
            assert.notOk(qs('.leaflet-control-browse #browse_data_toggle_62'));
        });

        it('should be removed from map.datalayers_index', function () {
            assert.equal(this.map.datalayers_index.length, 0);
        });

    });

});