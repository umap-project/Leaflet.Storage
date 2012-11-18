from django.utils import simplejson
from django import template
from django.conf import settings

register = template.Library()


@register.inclusion_tag('chickpea/css.html')
def chickpea_css():
    return {
        "STATIC_URL": settings.STATIC_URL
    }


@register.inclusion_tag('chickpea/js.html')
def chickpea_js():
    return {
        "STATIC_URL": settings.STATIC_URL
    }


@register.inclusion_tag('chickpea/map_fragment.html')
def map_fragment(map_instance):
    tilelayer_data = {
        'tilelayer': map_instance.tilelayers.all()[0].json,
        "rank": 1
    }
    return {
        'map': map_instance,
        'tilelayer': simplejson.dumps(tilelayer_data),
    }
