from django.contrib.gis import admin
from chickpea.models import Map, Marker, Category

admin.site.register(Map, admin.OSMGeoAdmin)
admin.site.register(Marker, admin.OSMGeoAdmin)
admin.site.register(Category)
