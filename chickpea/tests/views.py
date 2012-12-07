import os

from django.test import TestCase, TransactionTestCase
from django.utils import simplejson
from django.core.urlresolvers import reverse

from chickpea.models import Map, Category, Marker, Polygon, Polyline

from .base import (TileLayerFactory, LicenceFactory, MapFactory,
                   CategoryFactory, MarkerFactory)


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


class BaseFeatureViews(TestCase):

    def setUp(self):
        self.map = MapFactory()
        self.category = CategoryFactory(map=self.map)


class MarkerViews(BaseFeatureViews):

    def test_add_GET(self):
        url = reverse('marker_add', args=(self.map.pk, ))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn("html", json)
        self.assertIn("form", json['html'])

    def test_add_POST(self):
        url = reverse('marker_add', args=(self.map.pk, ))
        name = 'test-marker'
        post_data = {
            'name': name,
            'category': self.category.pk,
            'latlng': '{"type": "Point","coordinates": [-0.1318359375,51.474540439419755]}'
        }
        response = self.client.post(url, post_data, follow=True)
        self.assertEqual(response.status_code, 200)
        created_marker = Marker.objects.latest('pk')
        self.assertEqual(created_marker.name, name)
        # Test response is a json
        json = simplejson.loads(response.content)
        self.assertIn("features", json)

    def test_delete_GET(self):
        marker = MarkerFactory(category=self.category)
        url = reverse('marker_delete', args=(self.map.pk, marker.pk))
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json = simplejson.loads(response.content)
        self.assertIn("html", json)
        self.assertIn("form", json['html'])

    def test_delete_POST(self):
        marker = MarkerFactory(category=self.category)
        url = reverse('marker_delete', args=(self.map.pk, marker.pk))
        post_data = {
            'confirm': "yes",
        }
        response = self.client.post(url, post_data, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Marker.objects.filter(pk=marker.pk).count(), 0)
        # Check that category and map have not been impacted
        self.assertEqual(Map.objects.filter(pk=self.map.pk).count(), 1)
        self.assertEqual(Category.objects.filter(pk=self.category.pk).count(), 1)
        # Test response is a json
        json = simplejson.loads(response.content)
        self.assertIn("info", json)


class UploadData(TransactionTestCase):

    def setUp(self):
        self.map = MapFactory()
        self.category = CategoryFactory(map=self.map)

    def process_file(self, filename):
        """
        Process a file stored in tests/fixtures/
        """
        url = reverse('upload_data', kwargs={'map_id': self.map.pk})
        current_path = os.path.dirname(os.path.realpath(__file__))
        fixture_path = os.path.join(
            current_path,
            'fixtures',
            filename
        )
        f = open(fixture_path)
        post_data = {
            'category': self.category.pk,
            'data_file': f
        }
        response = self.client.post(url, post_data)
        return response

    def test_generic(self):
        # Contains tow Point, two Polygons and one Polyline
        response = self.process_file("test_upload_data.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Marker.objects.filter(category=self.category).count(), 2)
        self.assertEqual(Polygon.objects.filter(category=self.category).count(), 2)
        self.assertEqual(Polyline.objects.filter(category=self.category).count(), 1)

    def test_empty_coordinates_should_not_be_imported(self):
        self.assertEqual(Marker.objects.filter(category=self.category).count(), 0)
        self.assertEqual(Polyline.objects.filter(category=self.category).count(), 0)
        self.assertEqual(Polygon.objects.filter(category=self.category).count(), 0)
        response = self.process_file("test_upload_empty_coordinates.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Marker.objects.filter(category=self.category).count(), 0)
        self.assertEqual(Polyline.objects.filter(category=self.category).count(), 0)
        self.assertEqual(Polygon.objects.filter(category=self.category).count(), 0)

    def test_non_linear_ring_should_not_be_imported(self):
        response = self.process_file("test_upload_non_linear_ring.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Polygon.objects.filter(category=self.category).count(), 0)

    def test_missing_name_should_not_stop_import(self):
        # One feature is missing a name
        # We have to make sure that the other feature are imported
        self.assertEqual(Marker.objects.filter(category=self.category).count(), 0)
        response = self.process_file("test_upload_missing_name.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Marker.objects.filter(category=self.category).count(), 1)
        self.assertEqual(Polyline.objects.filter(category=self.category).count(), 1)
        self.assertEqual(Polygon.objects.filter(category=self.category).count(), 1)
