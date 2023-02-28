Archived: see https://github.com/umap-project/umap

===============
Leaflet-Storage
===============

Manage map and features with Leaflet and expose them for backend storage with an API.

-------------------
Feedback and issues
-------------------

Please use uMap issues: https://github.com/umap-project/umap/issues


----------------
Backend agnostic
----------------

Leaflet.Storage is backend agnostic: it only knows about a convention API.

Known backends:

- `django-leaflet-storage <https://github.com/yohanboniface/django-leaflet-storage>`_


================
Functional tests
================

Functional tests are implemented with `mocha <http://mochajs.org/#asynchronous-code>`_,
`chai <http://chaijs.com/>`_ and `sinon <http://sinonjs.org/>`_.

To launch them::

    cd Leaflet.Storage/
    make test

================
Show me an image
================

.. image:: http://i.imgur.com/vOllwf6.png
