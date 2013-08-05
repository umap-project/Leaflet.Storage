describe('L.Storage.Poly', function () {
    var datalayerEditPath = '/map/99/datalayer/edit/62/',
        polygonEditPath = '/map/99/polygon/edit/76/';

    before(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith('GET', '/feature/json/datalayer/62/', JSON.stringify(RESPONSES.datalayer62_GET));
        this.map = initMap({storage_id: 99});
        this.server.respond();
        this.server.respondWith('GET', datalayerEditPath, JSON.stringify(RESPONSES.map_datalayer_update_GET));
        toggleEdit();
    });
    after(function () {
        this.server.restore();
        resetMap();
    });

    describe('#edit()', function () {
        var submitButton;

        it('should have datalayer features created', function () {
            assert.equal(document.querySelectorAll('path').length, 2);
            assert.ok(qs('path[fill="none"]')); // Polyline
            assert.ok(qs('path[fill="DarkBlue"]')); // Polygon
        });

        it('should take into account styles changes made in the datalayer', function () {
            happen.click(qs('span#edit_datalayer_62'));
            this.server.respond();
            var modifiedResponse = DEFAULT_DATALAYER;
            modifiedResponse.options.color = "DarkRed";
            modifiedResponse.options.opacity = 0.8;
            this.server.respondWith('POST', datalayerEditPath, JSON.stringify({datalayer: modifiedResponse}));
            happen.click(qs('form#datalayer_edit input[type="submit"]'));
            this.server.respond();
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
            assert.notOk(qs('path[fill="DarkBlue"]'));
            assert.ok(qs('path[fill="DarkRed"]'));
        });

        it('should open a form on feature double click', function () {
            this.server.respondWith('GET', polygonEditPath, JSON.stringify(RESPONSES.map_polygon_update_GET))
            happen.dblclick(qs('path[fill="DarkRed"]'));
            this.server.respond();
            assert.ok(qs('form#feature_form'));
            submitButton = qs('form#feature_form input[type="submit"]');
            assert.ok(submitButton);
        });

        it('should give precedence to feature style over datalayer styles', function () {
            var modifiedResponse = {
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [[2.7685546875, 55.696163893908825], [1.483154296875, 55.19768334019969], [3.251953125, 53.85252660044951], [7.3388671875, 54.91451400766527], [5.262451171875, 55.59076338488528], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825], [2.7685546875, 55.696163893908825]]]
                },
                "type": "Feature",
                "id": 76,
                "properties": {
                    "datalayer_id": 62,
                    "name": "test poly simple",
                    "options": {
                        "opacity": null,
                        "weight": null,
                        "color": "DarkGreen", // color is set
                        "stroke": true,
                        "smoothFactor": null,
                        "dashArray": null,
                        "fillColor": null,
                        "fill": null,
                        "fillOpacity": null
                    },
                    "icon": {}
                }
            };
            this.server.respondWith('POST', polygonEditPath, JSON.stringify(modifiedResponse));
            happen.click(submitButton);
            this.server.respond();
            assert.notOk(qs('path[fill="DarkRed"]'));
            assert.ok(qs('path[fill="DarkGreen"]'));
            assert.ok(qs('path[fill="none"]')); // Polyline fill is unchanged
        });

        it('should not override already set style on features', function () {
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
                    "properties": {"options": {"color": "yellow"}, "datalayer_id": 62, "name": "test poly clickeabl"}
                }]
            };
            this.server.flush();
            this.server.respondWith('GET', '/feature/json/datalayer/62/', JSON.stringify(response));
            this.server.respondWith('GET', datalayerEditPath, JSON.stringify(RESPONSES.map_datalayer_update_GET));
            happen.click(qs('span#edit_datalayer_62'));
            this.server.respond();
            var modifiedResponse = DEFAULT_DATALAYER;
            modifiedResponse.options.color = "Chocolate";
            this.server.respondWith('POST', datalayerEditPath, JSON.stringify({datalayer: modifiedResponse}));
            happen.click(qs('form#datalayer_edit input[type="submit"]'));
            this.server.respond();
            assert.notOk(qs('path[fill="DarkBlue"]'));
            assert.notOk(qs('path[fill="Chocolate"]'));
            assert.ok(qs('path[fill="yellow"]'));
        });
    });

});