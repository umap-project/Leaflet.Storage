from django.conf.urls import patterns, url

from chickpea import views

urlpatterns = patterns('',
    url(r'^map/(?P<slug>[-_\w]+)/$', views.MapView.as_view(), name='map'),
    url(r'^poi/json/(?P<category_id>[\d]+)/$', views.POIGeoJSONListView.as_view(), name='poi_geojson_list'),
    url(r'^poi/add/$', views.POICreate.as_view(), name='poi_add'),
    url(r'^poi/edit/(?P<pk>\d+)/$', views.POIUpdate.as_view(), name='poi_update'),
    url(r'^poi/(?P<pk>\d+)/$', views.POIView.as_view(), name='poi'),
    url(r'^success/$', views.SuccessView.as_view(), name='success'),
)
