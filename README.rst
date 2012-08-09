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


Screenshot:

.. image:: http://i.imgur.com/IL1I7.jpg


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

