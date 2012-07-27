from django.views.generic import DetailView
from django.views.generic.list import BaseListView
from django.views.generic.base import TemplateView
from django.views.generic.detail import BaseDetailView
from django.views.generic.edit import CreateView, UpdateView
from django.http import HttpResponse
from django.utils import simplejson
from django.core.urlresolvers import reverse_lazy
from django.template.loader import render_to_string
from django.template import RequestContext

from vectorformats.Formats import Django, GeoJSON

from chickpea.models import Map, Marker, Category
from chickpea.utils import get_uri_template


def _urls_for_js(urls=None):
    """
    Return templated URLs prepared for javascript.
    """
    if urls is None:
        urls = [
            'marker_update',
            'marker_add',
            'marker_geojson_list',
            'marker'
        ]
    return dict(zip(urls, [get_uri_template(url) for url in urls]))


def render_to_json(templates, response_kwargs, context, request):
    """
    Generate a JSON HttpResponse with rendered template HTML.
    """
    html = render_to_string(
        templates,
        response_kwargs,
        RequestContext(request, context)
        )
    _json = simplejson.dumps({
        "html": html
        })
    return HttpResponse(_json)


class MapView(DetailView):

    model = Map

    def get_context_data(self, **kwargs):
        context = super(MapView, self).get_context_data(**kwargs)
        categories = Category.objects.all()  # TODO manage state
        category_data = [{"title": c.title, "pk": c.pk} for c in categories]
        context['categories'] = simplejson.dumps(category_data)
        context['urls'] = simplejson.dumps(_urls_for_js())
        return context


class MarkerGeoJSONMixin(object):

    def render_to_response(self, context):
        qs = self.get_queryset()
        djf = Django.Django(geodjango="latlng", properties=['title'])
        geoj = GeoJSON.GeoJSON()
        output = geoj.encode(djf.decode(qs))
        return HttpResponse(output)


class MarkerGeoJSONListView(BaseListView, MarkerGeoJSONMixin):
    model = Marker

    def get_queryset(self):
        return Marker.objects.filter(category=self.kwargs['category_id'])


class MarkerGeoJSONView(BaseDetailView, MarkerGeoJSONMixin):
    model = Marker

    def get_queryset(self):
        # GeoJSON expects a list
        return Marker.objects.filter(pk=self.kwargs['pk'])


class MarkerView(DetailView):
    model = Marker

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class MarkerAdd(CreateView):
    model = Marker
    success_url = reverse_lazy("success")

    def get_context_data(self, **kwargs):
        context = super(MarkerAdd, self).get_context_data(**kwargs)
        context['action'] = reverse_lazy("marker_add")
        return context

    def get_success_url(self):
        return reverse_lazy('marker_geojson', kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class MarkerUpdate(UpdateView):
    model = Marker
    success_url = reverse_lazy("success")

    def get_context_data(self, **kwargs):
        context = super(MarkerUpdate, self).get_context_data(**kwargs)
        context['action'] = reverse_lazy("marker_update", kwargs={"pk": self.kwargs['pk']})
        return context

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class SuccessView(TemplateView):
    """
    Generic view to say "hey, you have made this action success".
    Should be splitted in the future.
    """
    template_name = "chickpea/success.html"
