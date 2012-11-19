from django.utils import simplejson
from django.http import HttpResponse
from django.template import RequestContext
from django.views.generic import DetailView
from django.core.urlresolvers import reverse_lazy
from django.views.generic.list import BaseListView
from django.views.generic.base import TemplateView
from django.template.loader import render_to_string
from django.views.generic.detail import BaseDetailView
from django.views.generic.edit import CreateView, UpdateView

from vectorformats.Formats import Django, GeoJSON

from chickpea.models import Map, Marker, Category, Polyline, TileLayer, MapToTileLayer
from chickpea.utils import get_uri_template
from chickpea.forms import QuickMapCreateForm, UpdateMapExtentForm


def _urls_for_js(urls=None):
    """
    Return templated URLs prepared for javascript.
    """
    if urls is None:
        urls = [
            'marker_update',
            'marker_add',
            'marker',
            'feature_geojson_list',
            'polyline',
            'polyline_add',
            'polyline_update',
            'map_update_extent',
            'map_update',
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
        categories = Category.objects.filter(map=self.object)  # TODO manage state
        category_data = [c.json for c in categories]
        context['categories'] = simplejson.dumps(category_data)
        context['urls'] = simplejson.dumps(_urls_for_js())
        tilelayers_data = self.object.tilelayers_data
        context['tilelayers'] = simplejson.dumps(tilelayers_data)
        return context


class QuickMapCreate(CreateView):
    model = Map
    form_class = QuickMapCreateForm

    def form_valid(self, form):
        """
        Provide default values, to keep form simple.
        """
        self.object = form.save()
        layer = TileLayer.get_default()
        MapToTileLayer.objects.create(map=self.object, tilelayer=layer, rank=1)
        Category.objects.create(map=self.object, name="POIs", preset=True)
        response = {
            "redirect": self.get_success_url()
        }
        return HttpResponse(simplejson.dumps(response))

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)

    def get_context_data(self, **kwargs):
        kwargs.update({
            'action_url': reverse_lazy('map_add')
        })
        return super(QuickMapCreate, self).get_context_data(**kwargs)


# TODO: factorize with QuickCreate!
class QuickMapUpdate(UpdateView):
    model = Map
    form_class = QuickMapCreateForm

    def form_valid(self, form):
        self.object = form.save()
        response = {
            "redirect": self.get_success_url()
        }
        return HttpResponse(simplejson.dumps(response))

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)

    def get_context_data(self, **kwargs):
        kwargs.update({
            'action_url': reverse_lazy('map_update', args=[self.object.pk])
        })
        return super(QuickMapUpdate, self).get_context_data(**kwargs)


class UpdateMapExtent(UpdateView):
    model = Map
    form_class = UpdateMapExtentForm

    def form_invalid(self, form):
        return HttpResponse(form.errors)

    def form_valid(self, form):
        self.object = form.save()
        return HttpResponse("ok")


class GeoJSONMixin(object):

    def render_to_response(self, context):
        qs = self.get_queryset()
        djf = Django.Django(geodjango="latlng", properties=['name', 'category_id'])
        geoj = GeoJSON.GeoJSON()
        output = geoj.encode(djf.decode(qs))
        return HttpResponse(output)


class FeatureGeoJSONListView(BaseListView, GeoJSONMixin):

    def get_queryset(self):
        filters = {
            "category": self.kwargs['category_id']
        }
        markers = Marker.objects.filter(**filters)
        polylines = Polyline.objects.filter(**filters)
        return list(markers) + list(polylines)


class MarkerGeoJSONView(BaseDetailView, GeoJSONMixin):
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

    def get_success_url(self):
        return reverse_lazy('marker_geojson', kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class MarkerUpdate(UpdateView):
    model = Marker

    def get_success_url(self):
        return reverse_lazy('marker_geojson', kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class PolylineView(DetailView):
    model = Polyline

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class PolylineAdd(CreateView):
    model = Polyline

    def get_success_url(self):
        return reverse_lazy('polyline_geojson', kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class PolylineUpdate(UpdateView):
    model = Polyline

    def get_success_url(self):
        return reverse_lazy('polyline_geojson', kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class PolylineGeoJSONView(BaseDetailView, GeoJSONMixin):
    model = Polyline

    def get_queryset(self):
        # GeoJSON expects an iterable
        return Polyline.objects.filter(pk=self.kwargs['pk'])


class SuccessView(TemplateView):
    """
    Generic view to say "hey, you have made this action success".
    Should be splitted in the future.
    """
    template_name = "chickpea/success.html"
