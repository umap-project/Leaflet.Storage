# -*- coding: utf-8 -*-

from django.contrib.gis.db import models


class TileLayer(models.Model):
    name = models.CharField(max_length=50)
    url_template = models.CharField(
        max_length=200,
        help_text="URL template using OSM tile format"
    )
    minZoom = models.IntegerField(default=0)
    maxZoom = models.IntegerField(default=18)
    attribution = models.CharField(max_length=300)

    def __unicode__(self):
        return self.name

    @property
    def json(self):
        return dict((field.name, getattr(self, field.name)) for field in self._meta.fields)


class Map(models.Model):
    """
    A single thematical map.
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(db_index=True)
    description = models.TextField(blank=True, null=True)
    center = models.PointField(geography=True)
    zoom = models.IntegerField(default=8)
    locate = models.BooleanField(default=False)
    tilelayers = models.ManyToManyField(TileLayer, through="MapToTileLayer")

    objects = models.GeoManager()

    def __unicode__(self):
        return self.name

    @property
    def tilelayers_data(self):
        tilelayers_data = []
        for m2t in MapToTileLayer.objects.filter(map=self):
            tilelayers_data.append({
                "tilelayer": m2t.tilelayer.json,
                "rank": m2t.rank or 1  # default rank
            })
        return tilelayers_data


class MapToTileLayer(models.Model):
    tilelayer = models.ForeignKey(TileLayer)
    map = models.ForeignKey(Map)
    rank = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['rank']


class Icon(models.Model):
    """
    An icon of a Category or Marker.
    """
    name = models.CharField(max_length=50)
    icon = models.ImageField(upload_to="icon")

    def __unicode__(self):
        return self.name


class Category(models.Model):
    """
    Category of a Marker.
    """
    map = models.ForeignKey(Map)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=32)
    icon = models.ForeignKey(Icon, null=True, blank=True)
    preset = models.BooleanField(default=False, help_text="Display this category on load.")
    rank = models.IntegerField(null=True, blank=True)

    def __unicode__(self):
        return self.name

    @property
    def json(self):
        return {
            "name": self.name,
            "pk": self.pk,
            "color": self.color,
            "icon_url": self.icon.icon.url if self.icon else None,
            "preset": self.preset,
        }

    class Meta:
        ordering = ["rank"]


class AbstractMarker(models.Model):
    """
    Point of interest.
    """
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    latlng = models.PointField(geography=True)
    category = models.ForeignKey(Category)

    objects = models.GeoManager()

    def __unicode__(self):
        return self.name

    class Meta:
        abstract = True


# ############## #
# Default Models #
# ############## #

class Marker(AbstractMarker):
    pass
