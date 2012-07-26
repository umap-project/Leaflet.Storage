from django.views.generic import DetailView
from django.views.generic.list import BaseListView
from django.views.generic.base import TemplateView
from django.http import HttpResponse
from django.utils import simplejson
from django.views.generic.edit import CreateView, UpdateView
from django.core.urlresolvers import reverse_lazy

from vectorformats.Formats import Django, GeoJSON

from chickpea.models import Map, POI, Category
from chickpea.utils import get_uri_template


def _urls_for_js(urls=None):
    """
    Return templated URLs prepared for javascript.
    """
    if urls is None:
        urls = [
            'poi_update',
            'poi_geojson_list',
            'poi'
        ]
    return dict(zip(urls, [get_uri_template(url) for url in urls]))


class MapView(DetailView):

    model = Map

    def get_context_data(self, **kwargs):
        context = super(MapView, self).get_context_data(**kwargs)
        categories = Category.objects.all()  # TODO manage state
        category_data = [{"title": c.title, "pk": c.pk} for c in categories]
        context['categories'] = simplejson.dumps(category_data)
        context['urls'] = simplejson.dumps(_urls_for_js())
        return context


class GeoJSONResponseMixin(object):
    """
    Return a GeoJSON from a queryset.
    """
    pass


class POIGeoJSONListView(BaseListView):

    model = POI

    def get_queryset(self):
        return POI.objects.filter(category=self.kwargs['category_id'])

    def render_to_response(self, context):
        qs = self.get_queryset()
        djf = Django.Django(geodjango="position", properties=['title'])
        geoj = GeoJSON.GeoJSON()
        output = geoj.encode(djf.decode(qs))
        return HttpResponse(output)


class POIView(DetailView):
    model = POI


class POICreate(CreateView):
    model = POI


class POIUpdate(UpdateView):
    model = POI
    success_url = reverse_lazy("success")


class SuccessView(TemplateView):
    """
    Generic view to say "hey, you have made this action success".
    Should be splitted in the future.
    """
    template_name = "chickpea/success.html"
