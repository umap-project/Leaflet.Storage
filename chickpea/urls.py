from django.conf.urls import patterns, url
from django.views.decorators.csrf import csrf_exempt

from chickpea import views

urlpatterns = patterns('',
    url(r'^map/add/$', views.QuickMapCreate.as_view(), name='map_add'),
    url(r'^map/update/(?P<pk>[\d]+)/$', views.QuickMapUpdate.as_view(), name='map_update'),
    url(r'^map/update-extent/(?P<pk>[\d]+)/$', csrf_exempt(views.UpdateMapExtent.as_view()), name='map_update_extent'),
    url(r'^map/update-tilelayers/(?P<pk>[\d]+)/$', csrf_exempt(views.UpdateMapTileLayers.as_view()), name='map_update_tilelayers'),
    url(r'^map/(?P<slug>[-_\w]+)/$', views.MapView.as_view(), name='map'),
    url(r'^feature/json/category/(?P<category_id>[\d]+)/$', views.FeatureGeoJSONListView.as_view(), name='feature_geojson_list'),
    url(r'^marker/json/(?P<pk>[\d]+)/$', views.MarkerGeoJSONView.as_view(), name='marker_geojson'),
    url(r'^marker/add/$', views.MarkerAdd.as_view(), name='marker_add'),
    url(r'^marker/edit/(?P<pk>\d+)/$', views.MarkerUpdate.as_view(), name='marker_update'),
    url(r'^marker/(?P<pk>\d+)/$', views.MarkerView.as_view(), name='marker'),
    url(r'^polyline/add/$', views.PolylineAdd.as_view(), name='polyline_add'),
    url(r'^polyline/edit/(?P<pk>\d+)/$', views.PolylineUpdate.as_view(), name='polyline_update'),
    url(r'^polyline/(?P<pk>\d+)/$', views.PolylineView.as_view(), name='polyline'),
    url(r'^polyline/json/(?P<pk>[\d]+)/$', views.PolylineGeoJSONView.as_view(), name='polyline_geojson'),
    url(r'^success/$', views.SuccessView.as_view(), name='success'),
)
