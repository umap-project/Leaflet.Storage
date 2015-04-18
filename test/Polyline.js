describe('L.Storage.Polyline', function () {
    var p2ll, map;

    before(function () {
        this.map = map = initMap({storage_id: 99});
        enableEdit();
        p2ll = function (x, y) {
            return map.layerPointToLatLng([x, y]);
        };
        this.datalayer = this.map.createDataLayer();
        this.datalayer.connectToMap();;
    });

    after(function () {
        clickCancel();
        resetMap();
    });

    afterEach(function () {
        this.datalayer.empty();
    });

    describe('#isMulti()', function () {

        it('should return false for basic Polyline', function () {
            var layer = new L.S.Polyline(this.map, [[1, 2], [3, 4], [5, 6]], {datalayer: this.datalayer});
            assert.notOk(layer.isMulti())
        });

        it('should return false for nested basic Polyline', function () {
            var layer = new L.S.Polyline(this.map, [[[1, 2], [3, 4], [5, 6]]], {datalayer: this.datalayer});
            assert.notOk(layer.isMulti())
        });

        it('should return true for multi Polyline', function () {
            var latLngs = [
                [
                    [[1, 2], [3, 4], [5, 6]]
                ],
                [
                    [[7, 8], [9, 10], [11, 12]]
                ]
            ];
            var layer = new L.S.Polyline(this.map, latLngs, {datalayer: this.datalayer});
            assert.ok(layer.isMulti())
        });

    });

    describe('#contextmenu', function () {

        afterEach(function () {
            // Make sure contextmenu is hidden
            happen.once(document, {type: 'keydown', keyCode: 27});
        });

        describe('#in edit mode', function () {

            it('should allow to remove shape when multi', function () {
                var latlngs = [
                        [p2ll(100, 100), p2ll(100, 200)],
                        [p2ll(300, 350), p2ll(350, 400), p2ll(400, 300)]
                    ],
                    layer = new L.S.Polyline(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'})
                assert.equal(qst('Remove shape from the multi'), 1);
            });

            it('should not allow to remove shape when not multi', function () {
                var latlngs = [
                        [p2ll(100, 100), p2ll(100, 200)]
                    ],
                    layer = new L.S.Polyline(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'})
                assert.notOk(qst('Remove shape from the multi'));
            });

            it('should not allow to transform to polygon when multi', function () {
                var latlngs = [
                        [p2ll(100, 150), p2ll(100, 200)],
                        [p2ll(300, 350), p2ll(350, 400), p2ll(400, 300)]
                    ],
                    layer = new L.S.Polyline(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'});
                assert.notOk(qst('Transform to polygon'));
            });

            it('should allow to transform to polygon when not multi', function () {
                var latlngs = [p2ll(100, 150), p2ll(100, 200), p2ll(200, 100)],
                    layer = new L.S.Polyline(this.map, latlngs, {datalayer: this.datalayer}).addTo(this.datalayer);
                happen.once(layer._path, {type: 'contextmenu'});
                assert.equal(qst('Transform to polygon'), 1);
            });
        });

    });

    describe('#addShape', function () {

        it('"add shape" control should not be visible by default', function () {
            assert.notOk(qs('.storage-draw-polyline-multi'));
        });

        it('"add shape" control should be visible when editing a Polyline', function () {
            var layer = new L.S.Polyline(this.map, [p2ll(100, 100), p2ll(100, 200)], {datalayer: this.datalayer}).addTo(this.datalayer);
            layer.edit();
            assert.ok(qs('.storage-draw-polyline-multi'));
        });

        it('"add shape" control should extend the same multi', function () {
            var layer = new L.S.Polyline(this.map, [p2ll(100, 100), p2ll(100, 200)], {datalayer: this.datalayer}).addTo(this.datalayer);
            layer.edit();
            assert.notOk(layer.isMulti());
            happen.click(qs('.storage-draw-polyline-multi'));
            happen.at('mousemove', 300, 300);
            happen.at('click', 300, 300);
            happen.at('mousemove', 350, 300);
            happen.at('click', 350, 300);
            happen.at('click', 350, 300);
            assert.ok(layer.isMulti());
            assert.equal(this.datalayer._index.length, 1);
        });

    });

});
