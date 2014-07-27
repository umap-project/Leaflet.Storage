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
            clickCancel();
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
            assert.ok(qs('path[fill="DarkBlue"]'));
            assert.notOk(qs('path[fill="DarkRed"]'));
        });

        it('should set map.editedFeature on edit', function () {
            enableEdit();
            assert.notOk(this.map.editedFeature);
            happen.dblclick(qs('path[fill="DarkBlue"]'));
            assert.ok(this.map.editedFeature);
            disableEdit();
        });

        it('should reset map.editedFeature on panel open', function () {
            enableEdit();
            assert.notOk(this.map.editedFeature);
            happen.dblclick(qs('path[fill="DarkBlue"]'));
            assert.ok(this.map.editedFeature);
            this.map.displayCaption();
            assert.notOk(this.map.editedFeature);
            disableEdit();
        });

    });

    describe('#utils()', function () {
        var poly, marker;
        function setFeatures (datalayer) {
            datalayer.eachLayer(function (layer) {
                if (!poly && layer instanceof L.Polygon) {
                    poly = layer;
                }
                if (!marker && layer instanceof L.Marker) {
                    marker = layer;
                }
            });
        }
        it('should generate a valid geojson', function () {
            setFeatures(this.datalayer);
            assert.ok(poly);
            assert.deepEqual(poly.geometry(), {"type":"Polygon","coordinates":[[[11.25,53.585983654559804],[10.1513671875,52.9751081817353],[12.689208984375,52.16719363541221],[14.084472656249998,53.199451902831555],[12.63427734375,53.61857936489517],[11.25,53.585983654559804],[11.25,53.585983654559804]]]});
            // Ensure original latlngs has not been modified
            assert.equal(poly.getLatLngs().length, 6);
        });

        it('should remove empty _storage_options from exported geojson', function () {
            setFeatures(this.datalayer);
            assert.ok(poly);
            assert.deepEqual(poly.toGeoJSON().properties, {name: "name poly"});
            assert.ok(marker);
            assert.deepEqual(marker.toGeoJSON().properties, {_storage_options: {color: "OliveDrab"}, name: "test"});
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

    describe('#mergeInto()', function () {

        it('should remove duplicated join point when merging', function () {
            var line1 = this.datalayer._lineToLayer({}, [[0, 0], [0, 1]]),
                line2 = this.datalayer._lineToLayer({}, [[0, 1], [0, 2]]);
            line2.mergeInto(line1);
            assert.deepEqual(line1.getLatLngs(), [L.latLng([0, 0]), L.latLng([0, 1]), L.latLng([0, 2])]);
        });

        it('should revert candidate if first point is closer', function () {
            var line1 = this.datalayer._lineToLayer({}, [[0, 0], [0, 1]]),
                line2 = this.datalayer._lineToLayer({}, [[0, 2], [0, 1]]);
            line2.mergeInto(line1);
            assert.deepEqual(line1.getLatLngs(), [L.latLng([0, 0]), L.latLng([0, 1]), L.latLng([0, 2])]);
        });

    });

    describe('#splitAt()', function () {

        it('should conserve split point on both lines', function () {
            var original = this.datalayer._lineToLayer({}, [[0, 0], [0, 1], [0, 2]]);
            var other = original.splitAt(1);
            assert.deepEqual(original.getLatLngs(), [L.latLng([0, 0]), L.latLng([0, 1])]);
            assert.deepEqual(other.getLatLngs(), [L.latLng([0, 1]), L.latLng([0, 2])]);
        });


    });

    describe('#properties()', function () {

        it('should rename property', function () {
            var poly = this.datalayer._lineToLayer({}, [[0, 0], [0, 1], [0, 2]]);
            poly.properties.prop1 = 'xxx';
            poly.renameProperty('prop1', 'prop2');
            assert.equal(poly.properties.prop2, 'xxx');
            assert.ok(typeof poly.properties.prop1 === 'undefined');
        });

        it('should not create property when renaming', function () {
            var poly = this.datalayer._lineToLayer({}, [[0, 0], [0, 1], [0, 2]]);
            delete poly.properties.prop2;  // Make sure it doesn't exist
            poly.renameProperty('prop1', 'prop2');
            assert.ok(typeof poly.properties.prop2 === 'undefined');
        });

        it('should delete property', function () {
            var poly = this.datalayer._lineToLayer({}, [[0, 0], [0, 1], [0, 2]]);
            poly.properties.prop = 'xxx';
            assert.equal(poly.properties.prop, 'xxx');
            poly.deleteProperty('prop');
            assert.ok(typeof poly.properties.prop === 'undefined');
        });

    });

    describe('#matchFilter()', function () {
        var poly;

        it('should filter on properties', function () {
            poly = this.datalayer._lineToLayer({}, [[0, 0], [0, 1], [0, 2]]);
            poly.properties.name = 'mooring';
            assert.ok(poly.matchFilter('moo', ['name']));
            assert.notOk(poly.matchFilter('foo', ['name']));
        });

        it('should be case unsensitive', function () {
            assert.ok(poly.matchFilter('Moo', ['name']));
        });

        it('should match also in the middle of a string', function () {
            assert.ok(poly.matchFilter('oor', ['name']));
        });

        it('should handle multiproperties', function () {
            poly.properties.city = 'Teulada';
            assert.ok(poly.matchFilter('eul', ['name', 'city', 'foo']));
        });

    });

});
