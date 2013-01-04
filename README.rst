===============
Leaflet-Storage
===============

Manage map and features with Leaflet and expose them for backend storage with an API.

Demo: http://youmap.fluv.io/

----------------
Backend agnostic
----------------

Leaflet.Storage is backend agnostic: it only knows about a convention API.

Known backends:

- `django-leaflet-storage <https://github.com/yohanboniface/django-leaflet-storage>`_

More about backend API: https://github.com/yohanboniface/Leaflet.Storage/wiki/Backend

----------------------------
Front-end framework agnostic
----------------------------

Leaflet.Storage is framework agnostic: it doesn't know nothing about jQuery nor Foundation nor
Boostrap or whatever frontend framework. Instead, all the *user interface* is handled via events.
A default UI is provided, but one can use it's own modals, or popups, or panel, instead.

More about UI: https://github.com/yohanboniface/Leaflet.Storage/wiki/UI


================
Functional tests
================

Functional tests are implemented with `casperjs <http://casperjs.org>`_.

To launch them::

    cd Leaflet.Storage/
    make test

============
Dependencies
============

* `Leaflet <http://leafletj.scom/>`_
* `Leaflet.Draw <https://github.com/jacobtoye/Leaflet.draw/>`_
* `Leaflet.Hash <https://github.com/mlevans/leaflet-hash>`_

=======================
Maintained repositories
=======================

* `Github <https://github.com/yohanboniface/Leaflet.Storage>`_
* `Bitbucket <https://bitbucket.org/yohanboniface/leaflet.storage>`_

================
Show me an image
================

.. image:: http://i.imgur.com/dT3hj.jpg
