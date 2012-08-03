from django.contrib.gis import admin
from chickpea.models import Map, Marker, Category, Icon, TileLayer


class MapToTileLayerAdmin(admin.TabularInline):
    model = Map.tilelayers.through


class MapAdmin(admin.OSMGeoAdmin):
    inlines = [
        MapToTileLayerAdmin,
    ]

admin.site.register(Map, MapAdmin)
admin.site.register(Marker, admin.OSMGeoAdmin)
admin.site.register(Category)
admin.site.register(Icon)
admin.site.register(TileLayer)
