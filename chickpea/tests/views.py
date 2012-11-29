from django.test import TestCase
from django.utils import simplejson
from django.core.urlresolvers import reverse

from chickpea.models import Map, Category

from .base import TileLayerFactory, LicenceFactory, MapFactory


class MapViews(TestCase):

    def setUp(self):
        # We need a default tilelayer
        self.default_tilelayer = TileLayerFactory()
        # We need a default licence
        self.licence = LicenceFactory()

    def test_quick_create(self):
        url = reverse('map_add')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        # POST only mendatory fields
        name = 'test-map'
        post_data = {
            'name': name,
            'licence': self.licence.pk
        }
        response = self.client.post(url, post_data)
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        created_map = Map.objects.get(pk=1)
        self.assertEqual(json['redirect'], created_map.get_absolute_url())
        self.assertEqual(created_map.name, name)
        # A category must have been created automatically
        self.assertEqual(Category.objects.filter(map=created_map).count(), 1)
        # Default tilelayer must have been linked to the map
        self.assertEqual(created_map.tilelayers.count(), 1)
        self.assertEqual(created_map.tilelayers.all()[0], self.default_tilelayer)

    def test_quick_update_GET(self):
        map_inst = MapFactory()
        url = reverse('map_update', kwargs={'pk': map_inst.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn("html", json)
        self.assertIn(map_inst.name, json['html'])
