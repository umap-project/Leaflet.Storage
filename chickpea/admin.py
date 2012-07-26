from django.contrib.gis import admin
from chickpea.models import Map, POI, Category

admin.site.register(Map, admin.OSMGeoAdmin)
admin.site.register(POI, admin.OSMGeoAdmin)
admin.site.register(Category)
