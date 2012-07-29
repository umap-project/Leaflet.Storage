from django.contrib.gis.db import models
from django.conf import settings


class Map(models.Model):
    """
    A single thematical map.
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(db_index=True)
    description = models.TextField(blank=True, null=True)
    center = models.PointField(geography=True)

    objects = models.GeoManager()

    def __unicode__(self):
        return self.name


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
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=32)
    icon = models.ForeignKey(Icon, null=True, blank=True)

    def __unicode__(self):
        return self.title

    @property
    def json(self):
        return {
            "name": self.title,
            "pk": self.pk,
            "color": self.color,
            "icon_url": self.icon.icon.url if self.icon else None,
        }


class Marker(models.Model):
    """
    Point of interest.
    """
    title = models.CharField(max_length=200)
    latlng = models.PointField(geography=True)
    category = models.ForeignKey(Category)

    objects = models.GeoManager()

    def __unicode__(self):
        return self.title
