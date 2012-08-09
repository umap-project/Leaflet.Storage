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
