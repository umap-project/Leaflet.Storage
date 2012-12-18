===============
Leaflet-Storage
===============

Manage maps, draw features and store them in a given backend.


Known backends:

- `django-chickpea <https://github.com/yohanboniface/django-chickpea>`_


================
Functional tests
================

Functional tests are implemented with `casperjs <http://casperjs.org>`_.

To launch them::

    cd Leaflet.Storage/
    make test


==================
Building a backend
==================

You will need to:

- instanciate the `L.Storage.Map` with the correct options
- implement the requiered views

---------------------
L.Storage.Map options
---------------------

`L.Storage.Map` inherit from `L.Map`, so all the `L.Map` options works. Plus there are some specific to Storage.
Ex. usage::

    var MAP = new L.Storage.Map("map", options);

+------------------+------------+--------------------+---------------------------------------------+
| field name       | required   |    type            |   description                               |
+==================+============+====================+=============================================+
| storage_id       | yes        | int                | backend internal unique id                  |
+------------------+------------+--------------------+---------------------------------------------+
| urls             | yes        | object             | list of templates url                       |
+------------------+------------+--------------------+---------------------------------------------+
| default_icon_url | yes        | string             | URL of the default image to use in icons    |
+------------------+------------+--------------------+---------------------------------------------+
| center           | yes        | L.LatLng           | default center of the map                   |
|                  |            | or Array(lat, lng) |                                             |
|                  |            | or geojson Point   |                                             |
+------------------+------------+--------------------+---------------------------------------------+
| zoom             | yes        | int                | default zoom level                          |
+------------------+------------+--------------------+---------------------------------------------+
| categories       | yes        | Array of objects   | L.Storage.Layer to instanciate              |
+------------------+------------+--------------------+---------------------------------------------+
| tilelayers       | yes        | Array of objects   | L.TileLayer to instanciate                  |
+------------------+------------+--------------------+---------------------------------------------+
| allowEdit        | no         | bool               | display or not the edit toolbar             |
+------------------+------------+--------------------+---------------------------------------------+
| embedControl     | no         | bool               | display or not the control "Embed this map" |
+------------------+------------+--------------------+---------------------------------------------+
| locate           | no         | bool               | try or not to locate user on load           |
+------------------+------------+--------------------+---------------------------------------------+
| hash             | no         | bool               | activate hash management (permalink) or not |
+------------------+------------+--------------------+---------------------------------------------+


-----
Views
-----

map_add :

    GET: form with fields `name`, `description`, `licence` (licences available in backend)

    POST: fields `name`, `description`, `licences`

map_update :

    template variable: {pk}

    GET: forms with fields `name`, `description`, `licence` (licences available in backend)

    POST: fields `(str) name`, `(str) description`, `(backend internal id) licence`

map_update_tilelayers :

    template variable: {pk}
    
    GET: returns a form with available tilelayers
    
    POST: a form with selected tilelayers

    #TODO:
        - rank is not managed, so a refactor is expected here
        - POST json content returns now a redirect, this have to
          be changed to update the tilelayers in javascript directly

map_update_extent :

    template variable: {pk}

    POST: (int) `zoom`, (geojson) `center`

map_embed :

    GET: return the HTML to export an iframe view of the map
