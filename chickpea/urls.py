from django.conf.urls import patterns, url

from chickpea import views

urlpatterns = patterns('',
    url(r'^map/(?P<slug>[-_\w]+)/$', views.MapView.as_view(), name='map'),
    url(r'^marker/json/(?P<pk>[\d]+)/$', views.MarkerGeoJSONView.as_view(), name='marker_geojson'),
    url(r'^marker/json/category/(?P<category_id>[\d]+)/$', views.MarkerGeoJSONListView.as_view(), name='marker_geojson_list'),
    url(r'^marker/add/$', views.MarkerAdd.as_view(), name='marker_add'),
    url(r'^marker/edit/(?P<pk>\d+)/$', views.MarkerUpdate.as_view(), name='marker_update'),
    url(r'^marker/(?P<pk>\d+)/$', views.MarkerView.as_view(), name='marker'),
    url(r'^success/$', views.SuccessView.as_view(), name='success'),
)
