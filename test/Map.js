describe('L.Storage.Map', function(){

    before(function () {
        this.server = sinon.fakeServer.create();
        this.server.respondWith('/datalayer/62/', JSON.stringify(RESPONSES.datalayer62_GET));
        this.options = {
            storage_id: 99
        };
        this.map = initMap({storage_id: 99});
        this.server.respond();
        this.datalayer = this.map.getDataLayerByStorageId(62);
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
            assert.isTrue(L.DomUtil.hasClass(document.body, 'storage-edit-enabled'));
        });

        it('should have only one datalayer in its index', function () {
            assert.equal(this.map.datalayers_index.length, 1);
        });
    });

    describe('#editMetadata()', function () {
        var form, input;

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
            var new_name = 'This is a new name';
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
        var path = '/map/99/delete/',
            oldConfirm,
            newConfirm = function () {
                return true;
            };

        before(function () {
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
            sinon.spy(window, 'confirm');
            this.server.respondWith('POST', path, JSON.stringify({redirect: '#'}));
            happen.click(deleteLink);
            this.server.respond();
            assert(window.confirm.calledOnce);
            window.confirm.restore();
            done();
        });

    });

    describe('#importData()', function () {
        var fileInput, textarea, submit, formatSelect, layerSelect;

        it('should build a form on click', function () {
            happen.click(qs('a.upload-data'));
            fileInput = qs('.storage-upload input[type="file"]');
            textarea = qs('.storage-upload textarea');
            submit = qs('.storage-upload input[type="button"]');
            formatSelect = qs('.storage-upload select[name="format"]');
            layerSelect = qs('.storage-upload select[name="datalayer"]');
            assert.ok(fileInput);
            assert.ok(submit);
            assert.ok(textarea);
            assert.ok(formatSelect);
            assert.ok(layerSelect);
        });

        it('should import geojson from textarea', function () {
            assert.equal(this.datalayer._index.length, 3);
            textarea.value = '{"type": "FeatureCollection", "features": [{"geometry": {"type": "Point", "coordinates": [6.922931671142578, 47.481161607175736]}, "type": "Feature", "properties": {"color": "", "name": "Chez R\u00e9my", "description": ""}}, {"geometry": {"type": "LineString", "coordinates": [[2.4609375, 48.88639177703194], [2.48291015625, 48.76343113791796], [2.164306640625, 48.719961222646276]]}, "type": "Feature", "properties": {"color": "", "name": "P\u00e9rif", "description": ""}}]}';
            formatSelect.selectedIndex = 1;
            happen.click(submit);
            assert.equal(this.datalayer._index.length, 5);
        });

        it('should import kml from textarea', function () {
            happen.click(qs('a.upload-data'));
            textarea = qs('.storage-upload textarea');
            submit = qs('.storage-upload input[type="button"]');
            formatSelect = qs('.storage-upload select[name="format"]');
            assert.equal(this.datalayer._index.length, 5);
            textarea.value = kml_example;
            formatSelect.selectedIndex = 4;
            happen.click(submit);
            assert.equal(this.datalayer._index.length, 8);
        });

        it('should import gpx from textarea', function () {
            happen.click(qs('a.upload-data'));
            textarea = qs('.storage-upload textarea');
            submit = qs('.storage-upload input[type="button"]');
            formatSelect = qs('.storage-upload select[name="format"]');
            assert.equal(this.datalayer._index.length, 8);
            textarea.value = gpx_example;
            formatSelect.selectedIndex = 3;
            happen.click(submit);
            assert.equal(this.datalayer._index.length, 10);
        });

        it('should import csv from textarea', function () {
            happen.click(qs('a.upload-data'));
            textarea = qs('.storage-upload textarea');
            submit = qs('.storage-upload input[type="button"]');
            formatSelect = qs('.storage-upload select[name="format"]');
            assert.equal(this.datalayer._index.length, 10);
            textarea.value = csv_example;
            formatSelect.selectedIndex = 2;
            happen.click(submit);
            assert.equal(this.datalayer._index.length, 11);
        });


        it('should import GeometryCollection from textarea', function () {
            assert.equal(this.datalayer._index.length, 11);
            textarea.value = '{"type": "GeometryCollection","geometries": [{"type": "Point","coordinates": [-80.66080570220947,35.04939206472683]},{"type": "Polygon","coordinates": [[[-80.66458225250244,35.04496519190309],[-80.66344499588013,35.04603679820616],[-80.66258668899536,35.045580049697556],[-80.66387414932251,35.044280059194946],[-80.66458225250244,35.04496519190309]]]},{"type": "LineString","coordinates": [[-80.66237211227417,35.05950973022538],[-80.66269397735596,35.0592638296087],[-80.66284418106079,35.05893010615862],[-80.66308021545409,35.05833291342246],[-80.66359519958496,35.057753281001425],[-80.66387414932251,35.05740198662245],[-80.66441059112549,35.05703312589789],[-80.66486120223999,35.056787217822475],[-80.66541910171509,35.05650617911516],[-80.66563367843628,35.05631296444281],[-80.66601991653441,35.055891403570705],[-80.66619157791138,35.05545227534804],[-80.66619157791138,35.05517123204622],[-80.66625595092773,35.05489018777713],[-80.6662130355835,35.054222703761525],[-80.6662130355835,35.05392409072499],[-80.66595554351807,35.05290528508858],[-80.66569805145262,35.052044560077285],[-80.66550493240356,35.0514824490509],[-80.665762424469,35.05048117920187],[-80.66617012023926,35.04972582715769],[-80.66651344299316,35.049286665781096],[-80.66692113876343,35.0485313026898],[-80.66700696945189,35.048215102112344],[-80.66707134246826,35.04777593261294],[-80.66704988479614,35.04738946150025],[-80.66696405410767,35.04698542156371],[-80.66681385040283,35.046353007216055],[-80.66659927368164,35.04596652937105],[-80.66640615463257,35.04561518428889],[-80.6659984588623,35.045193568195565],[-80.66552639007568,35.044877354697526],[-80.6649899482727,35.04454357245502],[-80.66449642181396,35.04417465365292],[-80.66385269165039,35.04387600387859],[-80.66303730010986,35.043717894732545]]}]}';
            formatSelect = qs('.storage-upload select[name="format"]');
            formatSelect.selectedIndex = 1;
            happen.click(submit);
            assert.equal(this.datalayer._index.length, 14);
        });

        it('should import raw umap data from textarea', function () {
            //Right now, the import function will try to save and reload. Stop this from happening.
            var disabledSaveFunction = this.map.save;
            this.map.save = function(){};
            happen.click(qs('a.upload-data'));
            var initialLayerCount = Object.keys(this.map.datalayers).length;
            formatSelect = qs('.storage-upload select[name="format"]');
            textarea = qs('.storage-upload textarea');
            textarea.value = '{"type":"umap","properties":{"storage_id":666,"longCredit":"the illustrious mapmaker","shortCredit":"the mapmaker","slideshow":{},"captionBar":true,"dashArray":"5,5","fillOpacity":"0.5","fillColor":"Crimson","fill":true,"weight":"2","opacity":"0.9","smoothFactor":"1","iconClass":"Drop","color":"Red","limitBounds":{},"tilelayer":{"maxZoom":18,"url_template":"http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg","minZoom":0,"attribution":"Map tiles by [[http://stamen.com|Stamen Design]], under [[http://creativecommons.org/licenses/by/3.0|CC BY 3.0]]. Data by [[http://openstreetmap.org|OpenStreetMap]], under [[http://creativecommons.org/licenses/by-sa/3.0|CC BY SA]].","name":"Watercolor"},"licence":{"url":"","name":"No licence set"},"description":"Map description","name":"Imported map","tilelayersControl":true,"onLoadPanel":"caption","displayPopupFooter":true,"miniMap":true,"moreControl":true,"scaleControl":true,"zoomControl":true,"scrollWheelZoom":true,"datalayersControl":true,"zoom":6},"layers":[{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[4.2939,50.8893],[4.2441,50.8196],[4.3869,50.7642],[4.4813,50.7929],[4.413,50.9119],[4.2939,50.8893]]]},"properties":{"name":"Bruxelles","description":"polygon"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[3.0528,50.6269]},"properties":{"_storage_options":{"color":"Orange"},"name":"Lille","description":"une ville"}}],"_storage":{"displayOnLoad":true,"name":"Cities","id":108,"remoteData":{},"description":"A layer with some cities","color":"Navy","iconClass":"Drop","smoothFactor":"1","dashArray":"5,1","fillOpacity":"0.5","fillColor":"Blue","fill":true}},{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"LineString","coordinates":[[1.7715,50.9255],[1.6589,50.9696],[1.4941,51.0128],[1.4199,51.0638],[1.2881,51.1104]]},"properties":{"_storage_options":{"weight":"4"},"name":"tunnel sous la Manche"}}],"_storage":{"displayOnLoad":true,"name":"Tunnels","id":109,"remoteData":{}}}]}';
            formatSelect.value = 'umap';
            submit = qs('.storage-upload input[type="button"]');
            happen.click(submit);
            assert.equal(Object.keys(this.map.datalayers).length, initialLayerCount + 2);
            assert.equal(this.map.options.name, "Imported map");
            var foundFirstLayer = false;
            var foundSecondLayer = false;
            for (var idx in this.map.datalayers) {
                var datalayer = this.map.datalayers[idx];
                if (datalayer.options.name === "Cities") {
                    foundFirstLayer = true;
                    assert.equal(datalayer._index.length, 2);
                }
                if (datalayer.options.name === "Tunnels") {
                    foundSecondLayer = true;
                    assert.equal(datalayer._index.length, 1);
                }
            }
            assert.equal(foundFirstLayer, true);
            assert.equal(foundSecondLayer, true);

        });

        it('should only import options on the whitelist (umap format import)', function () {
            assert.equal(this.map.options.storage_id, 99);
        });

        it('should update title bar (umap format import)', function () {
            var title = qs("#map div.storage-main-edit-toolbox h3 a.storage-click-to-edit");
            assert.equal(title.innerHTML, "Imported map");
        });

        it('should reinitialize controls (umap format import)', function () {
            var minimap = qs("#map div.leaflet-control-container div.leaflet-control-minimap");
            assert.ok(minimap);
        });

        it('should update the tilelayer switcher control (umap format import)', function () {
            //The tilelayer in the imported data isn't in the tilelayer list (set in _pre.js), there should be no selection on the tilelayer switcher
            var selectedLayer = qs(".storage-tilelayer-switcher-container li.selected");
            assert.equal(selectedLayer, null);
        });

        it('should set the tilelayer (umap format import)', function () {
            assert.equal(this.map.selected_tilelayer._url, "http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg");
        });

    });

    describe('#localizeUrl()', function () {

        it('should replace known variables', function () {
            assert.equal(this.map.localizeUrl('http://example.org/{zoom}'), 'http://example.org/' + this.map.getZoom());
        });

        it('should keep unknown variables', function () {
            assert.equal(this.map.localizeUrl('http://example.org/{unkown}'), 'http://example.org/{unkown}');
        });

    });


});
