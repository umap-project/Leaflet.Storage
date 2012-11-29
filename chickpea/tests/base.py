from django.contrib.gis.geos import Point
import factory

from chickpea.models import Map, TileLayer, Licence


class LicenceFactory(factory.Factory):
    FACTORY_FOR = Licence
    name = "WTFPL"


class TileLayerFactory(factory.Factory):
    FACTORY_FOR = TileLayer
    name = "Test zoom layer"
    url_template = "http://{s}.test.org/{z}/{x}/{y}.png"
    attribution = "Test layer attribution"


class MapFactory(factory.Factory):
    FACTORY_FOR = Map
    name = "test map"
    slug = "test-map"
    center = Point(2, 51)
    licence = factory.SubFactory(LicenceFactory)
