from django.contrib.gis.db import models


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


class Category(models.Model):
    """
    Category of a Marker.
    """
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    def __unicode__(self):
        return self.title


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
