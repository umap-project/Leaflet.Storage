===============
Leaflet-Storage
===============

Manage map and features with Leaflet and expose them for backend storage with an API.

Demo: http://umap.fluv.io/

----------------
Backend agnostic
----------------

Leaflet.Storage is backend agnostic: it only knows about a convention API.

Known backends:

- `django-leaflet-storage <https://github.com/yohanboniface/django-leaflet-storage>`_


================
Functional tests
================

Functional tests are implemented with `mocha <http://visionmedia.github.io/mocha/#asynchronous-code>`_,
`chai <http://chaijs.com/>`_ and `sinon <http://sinonjs.org/>`_.

To launch them::

    cd Leaflet.Storage/
    make test

============
Dependencies
============

* `Leaflet <http://leafletj.scom/>`_
* `Leaflet.Draw <https://github.com/jacobtoye/Leaflet.draw/>`_
* `Leaflet.Hash <https://github.com/mlevans/leaflet-hash>`_
* `Leaflet.EditInOSM <http://github.com/yohanboniface/Leaflet.EditInOSM>`_
* `Leaflet.MiniMap <http://github.com/Norkart/Leaflet-MiniMap>`_
* `Leaflet.I18n <http://github.com/yohanboniface/Leaflet.i18n>`_
* `csv2geojson <http://github.com/mapbox/csv2geojson>`_
* `togeojson <http://github.com/mapbox/togeojson>`_
* `osm and geojson <http://github.com/aaronlidman/osm-and-geojson>`_
* `Leaflet.loading <http://github.com/ebrelsford/Leaflet.loading>`_
* `Leaflet.contextmenu <http://github.com/aratcliffe/Leaflet.contextmenu>`_
* `Leaflet.markercluster <http://github.com/Leaflet/Leaflet.markercluster>`_
* `Leaflet.measure <http://github.com/makinacorpus/Leaflet.MeasureControl>`_

================
Show me an image
================

.. image:: http://i.imgur.com/vOllwf6.png
