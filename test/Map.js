describe('L.Storage.Map', function(){

    before(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith('/datalayer/62/', JSON.stringify(RESPONSES.datalayer62_GET));
        this.options = {
            storage_id: 99
        };
        this.map = initMap({storage_id: 99});
        this.server.respond();
    });
    after(function () {
        this.server.restore();
        resetMap();
    });

    describe('#init()', function(){

        it('should be initialized', function(){
            assert.equal(this.map.options.storage_id, 99);
        });

        it('should have created the edit button', function(){
            assert.ok(qs('div.leaflet-control-edit-enable'));
        });

        it('should have datalayer control div', function(){
            assert.ok(qs('div.leaflet-control-browse'));
        });

        it('should have datalayer actions div', function(){
            assert.ok(qs('div.storage-browse-actions'));
        });

        it('should have icon container div', function(){
            assert.ok(qs('div.icon_container'));
        });

        it('should hide icon container div when hiding datalayer', function(){
            var el = qs('.leaflet-control-browse #browse_data_toggle_62 .layer-toggle');
            happen.click(el);
            assert.notOk(qs('div.icon_container'));
        });

        it('enable edit on click on toggle button', function () {
            var el = qs('div.leaflet-control-edit-enable a');
            happen.click(el);
            assert.isTrue(L.DomUtil.hasClass(document.body, "storage-edit-enabled"));
        });

        it('should have only one datalayer in its index', function () {
            assert.equal(this.map.datalayers_index.length, 1);
        });
    });

    describe('#editMetadata()', function () {
        var form, input, request,
            path = '/map/99/update/metadata/';

        it('should build a form on editMetadata control click', function (done) {
            var button = qs('a.update-map-settings');
            assert.ok(button);
            happen.click(button);
            form = qs('form.storage-form');
            input = qs('form[class="storage-form"] input[name="name"]');
            assert.ok(form);
            assert.ok(input);
            done();
        });

        it('should update map name on input change', function () {
            var new_name = "This is a new name";
            input.value = new_name;
            happen.once(input, {type: 'input'});
            assert.equal(this.map.options.name, new_name);
        });

        it('should have made Map dirty', function () {
            assert.ok(this.map.isDirty);
        });

        it('should have added dirty class on map container', function () {
            assert.ok(L.DomUtil.hasClass(this.map._container, 'storage-is-dirty'));
        });

    });

    describe('#delete()', function () {
        var path = "/map/99/delete/",
            submit, oldConfirm,
            newConfirm = function () {
                return true;
            };

        before(function () {
            var self = this;
            oldConfirm = window.confirm;
            window.confirm = newConfirm;
        });
        after(function () {
            window.confirm = oldConfirm;
        });

        it('should ask for confirmation on delete link click', function (done) {
            var button = qs('a.update-map-settings');
            assert.ok(button, 'update map info button exists');
            happen.click(button);
            var deleteLink = qs('a.storage-delete');
            assert.ok(deleteLink, 'delete map button exists');
            sinon.spy(window, "confirm");
            this.server.respondWith("POST", path, JSON.stringify({redirect: "#"}));
            happen.click(deleteLink);
            this.server.respond();
            assert(window.confirm.calledOnce);
            window.confirm.restore();
            done();
        });

    });

    xdescribe('#uploadData()', function () {
        var path = '/map/99/import/data/',
            form, submit;

        it('should load a form on click', function () {
            this.server.respondWith('GET', path, JSON.stringify(RESPONSES.map_upload_data_GET));
            happen.click(qs('a.upload-data'));
            this.server.respond();
            form = qs('form#upload_data');
            submit = qs('form#upload_data input[type="submit"]');
            assert.ok(form);
            assert.ok(submit);
        });

        it('should submit form on click', function () {
            this.server.respondWith('POST', path, JSON.stringify({datalayer: defaultDatalayerData(), info: 'ok'}));
            form.data_url.value = 'http://somewhere.org/test/{bbox}';
            happen.click(submit);
            this.server.respond();
            request = this.server.getRequest(path, 'POST');
            assert.equal(request.status, 200);
        });

    });

});