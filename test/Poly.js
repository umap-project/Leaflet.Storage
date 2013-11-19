describe('L.Storage.Poly', function () {

    before(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith('GET', '/datalayer/62/', JSON.stringify(RESPONSES.datalayer62_GET));
        this.map = initMap({storage_id: 99});
        this.server.respond();
    });
    after(function () {
        this.server.restore();
        resetMap();
    });

    describe('#edit()', function () {
        var submitButton;

        it('should have datalayer features created', function () {
            assert.equal(document.querySelectorAll('#map path.leaflet-clickable').length, 2);
            assert.ok(qs('path[fill="none"]')); // Polyline
            assert.ok(qs('path[fill="DarkBlue"]')); // Polygon
        });

        it('should take into account styles changes made in the datalayer', function () {
            enableEdit();
            happen.click(qs('span#edit_datalayer_62'));
            var colorInput = qs('form#datalayer-advanced-properties input[name=color]');
            changeInputValue(colorInput, "DarkRed");
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
            assert.notOk(qs('path[fill="DarkBlue"]'));
            assert.ok(qs('path[fill="DarkRed"]'));
        });

        it('should open a form on feature double click', function () {
            enableEdit();
            happen.dblclick(qs('path[fill="DarkRed"]'));
            var form = qs('form#storage-feature-properties');
            var input = qs('form#storage-feature-properties input[name="name"]');
            assert.ok(form);
            assert.ok(input);
        });

        it('should give precedence to feature style over datalayer styles', function () {
            var input = qs('form#storage-feature-advanced-properties input[name="color"]');
            assert.ok(input);
            changeInputValue(input, "DarkGreen");
            assert.notOk(qs('path[fill="DarkRed"]'));
            assert.notOk(qs('path[fill="DarkBlue"]'));
            assert.ok(qs('path[fill="DarkGreen"]'));
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
        });

        it('should not override already set style on features', function () {
            happen.click(qs('span#edit_datalayer_62'));
            changeInputValue(qs('form#datalayer-advanced-properties input[name=color]'), "Chocolate");
            assert.notOk(qs('path[fill="DarkBlue"]'));
            assert.notOk(qs('path[fill="DarkRed"]'));
            assert.notOk(qs('path[fill="Chocolate"]'));
            assert.ok(qs('path[fill="DarkGreen"]'));
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
        });

        it('should reset style on cancel click', function () {
            var oldConfirm = window.confirm;
            window.confirm = function () {return true;};
            happen.click(qs('.storage-main-edit-toolbox .leaflet-control-edit-cancel'));
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
            assert.ok(qs('path[fill="DarkBlue"]'));
            assert.notOk(qs('path[fill="DarkRed"]'));
            window.confirm = oldConfirm;
        });

    });

    describe('#changeDataLayer()', function () {

        it('should change style on datalayer select change', function () {
            enableEdit();
            happen.click(qs('.leaflet-control-browse .add-datalayer'));
            changeInputValue(qs('form.storage-form input[name="name"]'), "New layer");
            changeInputValue(qs('form#datalayer-advanced-properties input[name=color]'), "MediumAquaMarine");
            happen.dblclick(qs('path[fill="DarkBlue"]'));
            var select = document.querySelector('select[name=datalayer]');
            select.selectedIndex = 1;
            happen.once(select, {type: 'change'});
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
            assert.notOk(qs('path[fill="DarkBlue"]'));
            assert.ok(qs('path[fill="MediumAquaMarine"]'));
        });

    });

});