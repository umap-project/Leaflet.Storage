var qs = function (selector) {return document.querySelector(selector);};
var resetMap = function () {
    var mapElement = qs('#map');
    mapElement.innerHTML = 'Done';
    delete mapElement._leaflet;
    document.body.className = "";
};
var enableEdit = function () {
    happen.click(qs('a.leaflet-control-edit-enable'));
};
var clickSave = function () {
    happen.click(qs('a.leaflet-control-edit-save'));
};
var clickCancel = function () {
    var _confirm = window.confirm;
    window.confirm = function (text) {
        return true;
    };
    happen.click(qs('a.leaflet-control-edit-cancel'));
    happen.once(document.body, {type: 'keypress', keyCode: 13});
    window.confirm = _confirm;
};

var defaultDatalayerData = function (custom) {
    var _default = {
        "icon_class": "Default",
        "name": "Elephants",
        "displayOnLoad": true,
        "pk": 62,
        "pictogram_url": null,
        "opacity": null,
        "weight": null,
        "fillColor": "",
        "color": "",
        "stroke": true,
        "smoothFactor": null,
        "dashArray": "",
        "fillOpacity": null,
        "fill": true
    };
    return L.extend({}, _default, custom);
};

function initMap (options) {
    default_options = {
        "storage_id": 42,
        "center": { "type": "Point", "coordinates": [6.097, 53.127] },
        "datalayers": [],
        "urls": {
            "polygon_update": "/map/{map_id}/polygon/edit/{pk}/",
            "polygon_add": "/map/{map_id}/polygon/add/",
            "upload_data": "/map/{map_id}/import/data/",
            "marker_update": "/map/{map_id}/marker/edit/{pk}/",
            "map_embed": "/map/{map_id}/export/iframe/",
            "feature_geojson_list": "/feature/json/datalayer/{datalayer_id}/",
            "polyline": "/polyline/{pk}/",
            "marker": "/marker/{pk}/",
            "datalayer_add": "/map/{map_id}/datalayer/add/",
            "map_update_tilelayer": "/map/{map_id}/update/tilelayer/",
            "datalayer_update": "/map/{map_id}/datalayer/update/{pk}/",
            "datalayer_view": "/datalayer/{pk}/",
            "datalayer_create": "/map/{map_id}/datalayer/create/",
            "marker_add": "/map/{map_id}/marker/add/",
            "polygon": "/polygon/{pk}/",
            "polygon_geojson": "/polygon/json/{pk}/",
            "marker_geojson": "/marker/json/{pk}/",
            "map": "/map/{username}/{slug}/",
            "polyline_add": "/map/{map_id}/polyline/add/",
            "map_infos": "/map/{map_id}/infos/caption/",
            "polyline_delete": "/map/{map_id}/polyline/delete/{pk}/", 
            "logout": "/logout/",
            "polyline_geojson": "/polyline/json/{pk}/",
            "map_update": "/map/{map_id}/update/metadata/",
            "map_update_permissions": "/map/{map_id}/update/permissions/",
            "map_add": "/map/add/",
            "polyline_update": "/map/{map_id}/polyline/edit/{pk}/",
            "map_update_extent": "/map/{map_id}/update/extent/",
            "polygon_delete": "/map/{map_id}/polygon/delete/{pk}/",
            "marker_delete": "/map/{map_id}/marker/delete/{pk}/",
            "datalayer_delete": "/map/{map_id}/datalayer/delete/{pk}/",
            "map_delete": "/map/{map_id}/delete/",
            "login": "/login/"
        },
        "default_iconUrl": "../src/img/marker.png",
        "zoom": 6,
        "tilelayers": [{
                "attribution": "\u00a9 OSM Contributors",
                "name": "OpenStreetMap",
                "url_template": "http://localhost:20008/tile/openriverboatmap/{z}/{x}/{y}.png",
                "minZoom": 0,
                "maxZoom": 18,
                "id": 1,
                "selected": true
        },
        {
            "attribution": "HOT and friends",
            "name": "HOT OSM-fr server",
            "url_template": "http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            "rank": 99,
            "minZoom": 0,
            "maxZoom": 20,
            "id": 2
        }],
        "tilelayer": {
            "attribution": "HOT and friends",
            "name": "HOT OSM-fr server",
            "url_template": "http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            "rank": 99,
            "minZoom": 0,
            "maxZoom": 20,
            "id": 2
        },
        "allowEdit": 1,
        "embedControl": 1,
        "homeControl": 1,
        "locateControl": 1,
        "jumpToLocationControl": 1,
        "enableMarkerDraw": 1,
        "enablePolylineDraw": 1,
        "enablePolygonDraw": 1,
        "name": "name of the map",
        "displayPopupFooter": false,
        "displayDataBrowserOnLoad": false
    };
    default_options.datalayers.push(defaultDatalayerData());
    options = L.extend({}, default_options, options);
    return new L.Storage.Map("map", options);
}

var RESPONSES = {
    'datalayer62_GET': {
        "crs": null,
        "type": "FeatureCollection",
        "_storage": defaultDatalayerData(),
        "features": [{
            "geometry": {
                "type": "Point",
                "coordinates": [-0.274658203125, 52.57634993749885]
            },
            "type": "Feature",
            "id": 1807,
            "properties": {"options": {}, "datalayer_id": 62, "name": "test", "icon": {"url": null, "class": null}}
        },
        {
            "geometry": {
                "type": "LineString",
                "coordinates": [[-0.5712890625, 54.47642158429295], [0.439453125, 54.610254981579146], [1.724853515625, 53.44880683542759], [4.163818359375, 53.98839506479995], [5.306396484375, 53.533778184257805], [6.591796875, 53.70971358510174], [7.042236328124999, 53.35055131839989]]
            },
            "type": "Feature",
            "id": 20, "properties": {"options": {"fill": false}, "datalayer_id": 62, "name": "test", "icon": {}}
        },
        {
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[11.25, 53.585983654559804], [10.1513671875, 52.9751081817353], [12.689208984375, 52.16719363541221], [14.084472656249998, 53.199451902831555], [12.63427734375, 53.61857936489517], [11.25, 53.585983654559804], [11.25, 53.585983654559804]]]
            },
            "type": "Feature",
            "id": 76,
            "properties": {"options": {}, "datalayer_id": 62, "name": "test poly clickeabl", "icon": {}}
        }]
    },
    "map_update_medatada_GET": {
        "html": "<form action='/map/99/update/metadata/'' method='post' id='map_edit'><input name='name' placeholder='Name' value='Birds map' maxlength='100' type='text' id='id_name' /><textarea id='id_description' rows='10' placeholder='Description' cols='40' name='description'>Where have you seen birds?</textarea><label for='licence'>Licence</label><select name='licence' id='id_licence'><option value=''>---------</option><option value='1' selected='selected'>WTFL</option></select><small class='help-text'>Choose the map licence.</small><input type='hidden' name='center' value='POINT (15.9191894531249982 49.0018439179785261)' id='id_center' /> <input type='submit' /> <a href='/map/99/delete/' id='delete_map_button' >Delete</a></form>"
    },
    "map_delete_GET": {
        "html": "<form method='post' action='/map/99/delete/' id='map_delete' onsubmit='return false;'> <input type='hidden' name='confirm' value='yes' /> <input type='submit' value='yes' class='button' /></form>"
    },
    "map_upload_data_GET": {
        "html": "<form action='/map/99/import/data/' method='post' enctype='multipart/form-data' id='upload_data'><select name='content_type' id='id_content_type'><option value='geojson'>GeoJSON</option><option value='kml'>KML</option><option value='gpx'>GPX</option></select> <input type='file' name='data_file' /> <input type='text' name='data_url' /> <select name='datalayer'><option value='62'>Armel Le Cleac&#39;h</option><option value='67'>Fran\u00e7ois Gabart</option></select><input type='submit' class='button' /></form>"
    },
    "map_datalayer_update_GET": {
        "html": "<form action='/map/99/datalayer/edit/62/' method='post' id='datalayer_edit'> <input name='name' value='Elephants' maxlength='50' type='text' id='id_name' /> <textarea id='id_description' rows='10' placeholder='Description' cols='40' name='description'>All the elephants.</textarea> <input name='color' value='Pink' maxlength='32' type='text' /> <input type='text' placeholder='Rank' name='rank' value='3' id='id_rank' /> <input checked='checked' type='checkbox' name='display_on_load' /><input type='text' name='weight' /><input checked='checked' type='checkbox' name='stroke' /> <input type='text' name='smoothFactor' /> <input type='text' name='opacity' /> <input checked='checked' type='checkbox' name='fill' /> <input type='text' name='fillOpacity' /> <input type='text' name='fillColor' /> <input type='text' name='dashArray' /> <input type='hidden' name='map' value='18' id='id_map' /><input type='hidden' name='map' value='18' id='id_map' /> <input type='submit' class='button' /> <div id='storage-form-iconfield'></div>  <input type='hidden' name='icon_class' /> <input type='hidden' name='pictogram' /> <a href='/map/99/datalayer/delete/62/' id='delete_datalayer_button' >Delete</a> </form>"
    },
    "map_datalayer_delete_GET": {
        "html": "<form method='post' action='' id='datalayer_delete' onsubmit='return false;'> <input type='hidden' name='confirm' value='yes' />    <input type='submit' value='yes' class='button' /></form>"
    },
    "map_polygon_update_GET": {
        "html": "<form method='post' action='' id='feature_form' onsubmit='return false;'>  <input name='name' value='test poly simple' maxlength='200' type='text' /> <textarea rows='10' cols='40' name='description'></textarea><select name='datalayer'><option value=''>---------</option><option value='62' selected='selected'>My data</option></select> <input type='text' name='color' value='red' /> <input type='text' name='weight' value='1' /><input checked='checked' type='checkbox' name='stroke' /> <input type='text' name='smoothFactor' value='1.0' /> <input type='text' name='opacity' value='0.5' /> <input checked='checked' type='checkbox' name='fill' /> <input type='text' name='fillOpacity' value='0.1' /> <input type='text' name='fillColor' value='yellow' /> <input type='text' name='dashArray' /> <input type='hidden' name='latlng' value='POLYGON ((2.7685546875000000 55.6961638939088246, 1.4831542968750000 55.1976833401996885, 3.2519531250000000 53.8525266004495080, 7.3388671875000000 54.9145140076652680, 5.2624511718750000 55.5907633848852782, 2.7685546875000000 55.6961638939088246, 2.7685546875000000 55.6961638939088246, 2.7685546875000000 55.6961638939088246, 2.7685546875000000 55.6961638939088246, 2.7685546875000000 55.6961638939088246, 2.7685546875000000 55.6961638939088246))' />  <input type='submit' class='button' /> <a href='/map/99/polygon/delete/76/' id='delete_feature_button' >Delete</a>    </form>"
    }
};


sinon.fakeServer.getRequest = function (path, method) {
    var request;
    for (var i=0, l=this.requests.length; i<l; i++) {
        request = this.requests[i];
        // In case of a form submit, the request start with file://
        if (request.url.indexOf(path) !== -1) {
            if (!method || request.method === method) {
                return request;
            }
        }
    }
};

sinon.fakeServer.flush = function () {
    this.responses = [];
};
