import os

from django.test import TestCase
from django.utils import simplejson
from django.core.urlresolvers import reverse

from chickpea.models import Map, Category, Marker, Polygon, Polyline

from .base import TileLayerFactory, LicenceFactory, MapFactory, CategoryFactory


class MapViews(TestCase):

    def setUp(self):
        # We need a default tilelayer
        self.default_tilelayer = TileLayerFactory()
        # We need a default licence
        self.licence = LicenceFactory()

    def test_quick_create_GET(self):
        url = reverse('map_add')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn("html", json)
        self.assertIn("form", json['html'])

    def test_quick_create_POST(self):
        url = reverse('map_add')
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

    def test_quick_update_POST(self):
        map_inst = MapFactory()
        url = reverse('map_update', kwargs={'pk': map_inst.pk})
        # POST only mendatory fields
        new_name = 'new map name'
        post_data = {
            'name': new_name,
            'licence': map_inst.licence.pk
        }
        response = self.client.post(url, post_data)
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertNotIn("html", json)
        updated_map = Map.objects.get(pk=map_inst.pk)
        self.assertEqual(json['redirect'], updated_map.get_absolute_url())
        self.assertEqual(updated_map.name, new_name)


class UploadData(TestCase):

    def test_generic(self):
        map_inst = MapFactory()
        category = CategoryFactory(map=map_inst)
        url = reverse('upload_data', kwargs={'map_id': map_inst.pk})
        current_path = os.path.dirname(os.path.realpath(__file__))
        fixture_path = os.path.join(
            current_path,
            'fixtures',
            'test_upload_data.json'
        )
        # Contains tow Point, two Polygons and one Polyline
        f = open(fixture_path)
        post_data = {
            'category': category.pk,
            'data_file': f
        }
        response = self.client.post(url, post_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Marker.objects.filter(category=category).count(), 2)
        self.assertEqual(Polygon.objects.filter(category=category).count(), 2)
        self.assertEqual(Polyline.objects.filter(category=category).count(), 1)
