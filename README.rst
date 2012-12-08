================
Leaflet-Chickpea
================

Manage maps, draw features and store them in a given backend.


Known backends:
- `django-chickpea <https://github.com/yohanboniface/django-chickpea>`_


-------
Classes
-------

L.ChickpeaMap
-------------

Ex. usage:
```
var MAP = new L.ChickpeaMap("map", options);

```

Options:
(required) chickpea_id :
    (int) backend internal unique id
(required) urls:
    object reprenseting all templates URL of the backend.
    It's important to respect the expected variables.
    Ex.:
    ```
    "urls": {
        "polygon_update": "/map/{map_id}/polygon/edit/{pk}/",
        "polygon_add": "/map/{map_id}/polygon/add/", 
        "map_update_tilelayers": "/map/update-tilelayers/{pk}/", 
        "category_update": "/map/{map_id}/category/edit/{pk}/", 
        "marker_add": "/map/{map_id}/marker/add/", 
        "polygon": "/polygon/{pk}/", 
        "marker_update": "/map/{map_id}/marker/edit/{pk}/", 
        "polyline_delete": "/map/{map_id}/polyline/delete/{pk}/", 
        "map_embed": "/map/embed/{pk}/", 
        "feature_geojson_list": "/category/{category_id}/feature/json/", 
        "polyline_update": "/map/{map_id}/polyline/edit/{pk}/", 
        "polyline_add": "/map/{map_id}/polyline/add/", 
        "map_update_extent": "/map/update-extent/{pk}/", 
        "polyline": "/polyline/{pk}/", 
        "category_add": "/map/{map_id}/category/add/", 
        "polygon_delete": "/map/{map_id}/polygon/delete/{pk}/", 
        "marker": "/marker/{pk}/", 
        "marker_delete": "/map/{map_id}/marker/delete/{pk}/", 
        "map_update": "/map/update/{pk}/", 
        "upload_data": "/map/{map_id}/upload-data/"
    },
    ```
(required) default_icon_url:
    an url of an image (26x26 max)
center:
    a L.LatLng object or an Array(lat, lng)
zoom:
    (int) a zoom level
categories:
    Array of objects representing ChickpeaOverlay instances
    ex:
    ```
    {
        categories: [{"icon_class": "Default", "name": "POIs", "color": "DarkBlue", "preset": true, "pk": 26, "pictogram_url": null}]
    }
    ```
tilelayers:
    Array of objects representing L.TileLayer instances:
    Ex.:
    ```
    "tilelayers": [{"tilelayer": {"attribution": "OSM Contributors", "name": "OpenStreetMap", "url_template": "http://tile.openstreetmap.org/{z}/{x}/{y}.png", "minZoom": 0, "maxZoom": 18, "id": 1}, "rank": 1}],
    ```
allowEdit:
    (bool) display or not the edit toolbar
embedControl:
    (bool) display or not the control "Embed this map"
locate:
    (bool) try or not to locate user

Views:
map_update_tilelayers:
    template variable: {pk}
    GET: returns a form with available tilelayers
    POST: a form with selected tilelayers
    #TODO:
        - rank is not managed, so a refactor is expected here
        - POST json content returns now a redirect, this have to
        be changed to update the tilelayers in javascript directly
