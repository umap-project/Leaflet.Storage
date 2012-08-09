===============
Django-Chickpea
===============

Provide collaborative maps for your Django project.
Built on top of Geodjango and Leaflet.

Goals:

- plugable
- light
- edit in place
- extendable


Supported features (others are planned: Polygon, Circle, etc.):

- Marker
- Polyline

Screenshots:

.. image:: http://i.imgur.com/IL1I7.jpg
.. image:: http://i.imgur.com/cSJmN.jpg


------------
Installation
------------

.. note::
   You will need a geo aware database. See `Geodjango doc <https://docs.djangoproject.com/en/dev/ref/contrib/gis/install/>`_ for backend installation.

.. note::
   You will need Leaflet, Leaflet.Draw and Leaflet.Hash.
   They are submodules of this module, but pip will not fetch them automatically (will the case in future version of pip).

Then you can pip install the rep, only from its repo for now::

    pip install git+git://github.com/yohanboniface/django-chickpea.git

Add `chickpea` to you apps::

    INSTALLED_APPS = (
        ...
        "chickpea",
    )

Include `chickpea` urls::

   (r'', include('chickpea.urls')),

Create tables::

    python manage.py syncdb


-----------
Basic usage
-----------

From the Django admin (for now), you need to create at least:
- one TileLayer instance
- one Map instance
- one Category instance

Then, go to the map front page (something like http://localhost:8017/map/my-map-slug), and you will be able to add Markers and Polylines.


----------------------
Advanced configuration
----------------------

Use your own Marker and Polyline models
---------------------------------------

Sometimes, you will need to add specific properties to the Marker or the Polyline. Its easy to do so with `chickpea`.

Create a model that inherit from AbstractMarker (for Marker example)::

    from chickpea.base_models import AbstractMarker


    class MyMarker(AbstractMarker):
        # your fields here

Then, in your settings, add::

    CHICKPEA_MODELS = {
        "Marker": ('my_app', 'MyModel'),
    }

.. warning::
   Of course, you will need to do this *before* running the initial syncdb.


Decide which features are editable
----------------------------------

For now, only the Marker and Polyline features are supported.
Maybe you just want for example the Marker to be editable.
For this, you will need to override the map configuration in JavaScript.
You will have to explicity prevent the Polyline editing, doing so::

    <script>
        // create map_settings like the default template does
        map_settings.editOptions = {
                "polyline": null
            }
        // Create the map like the default template does
    </script>


Disabling totally inplace editing
---------------------------------
Again, this have to be done in JavaScript::

    <script>
        map_settings.allowEdit = true;
    </script>