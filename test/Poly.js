describe('L.Storage.Poly', function () {

    before(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith('GET', '/datalayer/62/', JSON.stringify(RESPONSES.datalayer62_GET));
        this.map = initMap({storage_id: 99});
        this.datalayer = this.map.getDataLayerByStorageId(62);
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
            happen.click(qs('#browse_data_toggle_62 .layer-edit'));
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

        it('should not handle _storage_options has normal property', function () {
            assert.notOk(qs('form#storage-feature-properties input[name="_storage_options"]'));
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

        it('should remove stroke if set to no', function () {
            assert.notOk(qs('path[stroke="none"]'));
            var select = qs('form#storage-feature-advanced-properties select[name="stroke"]');
            assert.ok(select);
            select.selectedIndex = 2;
            happen.once(select, {type: 'change'});
            assert.ok(qs('path[stroke="none"]'));
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
        });

        it('should not override already set style on features', function () {
            happen.click(qs('#browse_data_toggle_62 .layer-edit'));
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

    describe('#utils()', function () {
        var poly;
        it('should generate a valid geojson', function () {
            this.datalayer.eachLayer(function (layer) {
                if (!poly && layer instanceof L.Polygon) {
                    poly = layer;
                }
            });
            assert.ok(poly);
            assert.deepEqual(poly.geometry(), {"type":"Polygon","coordinates":[[[11.25,53.585983654559804],[10.1513671875,52.9751081817353],[12.689208984375,52.16719363541221],[14.084472656249998,53.199451902831555],[12.63427734375,53.61857936489517],[11.25,53.585983654559804],[11.25,53.585983654559804]]]});
            // Ensure original latlngs has not been modified
            assert.equal(poly.getLatLngs().length, 6);
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
            clickCancel();
        });

    });

    describe('#openPopup()', function () {

        it('should open a popup on click', function () {
            assert.notOk(qs('.leaflet-popup-content'));
            happen.click(qs('path[fill="DarkBlue"]'));
            var title = qs('.leaflet-popup-content');
            assert.ok(title);
            assert.ok(title.innerHTML.indexOf('name poly'));
        });

    });

});