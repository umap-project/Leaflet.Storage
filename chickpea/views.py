from django.utils import simplejson
from django.http import HttpResponse
from django.template import RequestContext
from django.views.generic import DetailView
from django.shortcuts import get_object_or_404
from django.core.urlresolvers import reverse_lazy
from django.views.generic.list import BaseListView
from django.views.generic.base import TemplateView
from django.template.loader import render_to_string
from django.views.generic.detail import BaseDetailView
from django.views.generic.edit import CreateView, UpdateView

from vectorformats.Formats import Django, GeoJSON

from chickpea.models import (Map, Marker, Category, Polyline, TileLayer,
                             MapToTileLayer, Polygon)
from chickpea.utils import get_uri_template
from chickpea.forms import QuickMapCreateForm, UpdateMapExtentForm, CategoryForm


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
            'polygon',
            'polygon_add',
            'polygon_update',
            'map_update_extent',
            'map_update_tilelayers',
            'map_update',
            'map_embed',
            'category_add',
            'category_update',
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


def simple_json_response(**kwargs):
    return HttpResponse(simplejson.dumps(kwargs))


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
        return simple_json_response(redirect=self.get_success_url())

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
        return simple_json_response(redirect=self.get_success_url())

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
        return simple_json_response(info="Zoom and center updated with success!")


class UpdateMapTileLayers(TemplateView):
    template_name = "chickpea/map_update_tilelayers.html"

    def get_context_data(self, **kwargs):
        map_inst = get_object_or_404(Map, pk=kwargs['pk'])
        return {
            "tilelayers": TileLayer.objects.all(),
            'map': map_inst
        }

    def post(self, request, *args, **kwargs):
        # TODO: manage with a proper form
        map_inst = get_object_or_404(Map, pk=kwargs['pk'])
        # Empty relations (we don't keep trace of unchecked box for now)
        MapToTileLayer.objects.filter(map=map_inst).delete()
        for key, value in request.POST.iteritems():
            if key.startswith('tilelayer_'):
                try:
                    pk = int(value)
                except ValueError:
                    pass
                else:
                    # TODO manage rank
                    MapToTileLayer.objects.create(map=map_inst, tilelayer_id=pk)
        response = {
            "redirect": map_inst.get_absolute_url()
        }
        return HttpResponse(simplejson.dumps(response))

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class EmbedMap(DetailView):
    model = Map
    template_name = "chickpea/map_embed.html"

    def get_context_data(self, **kwargs):
        # FIXME use settings for SITE_URL?
        iframe_url = 'http://%s%s' % (self.request.META['HTTP_HOST'], self.object.get_absolute_url())
        kwargs.update({
            'iframe_url': iframe_url
        })
        return super(EmbedMap, self).get_context_data(**kwargs)

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


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
        polygons = Polygon.objects.filter(**filters)
        return list(markers) + list(polylines) + list(polygons)


class MarkerGeoJSONView(BaseDetailView, GeoJSONMixin):
    model = Marker

    def get_queryset(self):
        # GeoJSON expects a list
        return Marker.objects.filter(pk=self.kwargs['pk'])


class MarkerView(DetailView):
    model = Marker

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class FeatureAdd(CreateView):

    def get_success_url(self):
        return reverse_lazy(self.geojson_url, kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)

    def get_form(self, form_class):
        form = super(FeatureAdd, self).get_form(form_class)
        map_inst = get_object_or_404(Map, pk=self.kwargs['map_id'])
        form.fields['category'].queryset = Category.objects.filter(map=map_inst)
        return form


class FeatureUpdate(UpdateView):

    def get_success_url(self):
        return reverse_lazy(self.geojson_url, kwargs={"pk": self.object.pk})

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)

    # TODO: factorize with FeatureAdd!
    def get_form(self, form_class):
        form = super(FeatureUpdate, self).get_form(form_class)
        map_inst = get_object_or_404(Map, pk=self.kwargs['map_id'])
        form.fields['category'].queryset = Category.objects.filter(map=map_inst)
        return form


class MarkerUpdate(FeatureUpdate):
    model = Marker
    geojson_url = 'marker_geojson'


class MarkerAdd(FeatureAdd):
    model = Marker
    geojson_url = 'marker_geojson'


class PolylineView(DetailView):
    model = Polyline

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class PolylineAdd(FeatureAdd):
    model = Polyline
    geojson_url = 'polyline_geojson'


class PolylineUpdate(FeatureUpdate):
    model = Polyline
    geojson_url = 'polyline_geojson'


class PolylineGeoJSONView(BaseDetailView, GeoJSONMixin):
    model = Polyline

    def get_queryset(self):
        # GeoJSON expects an iterable
        return Polyline.objects.filter(pk=self.kwargs['pk'])


class PolygonView(DetailView):
    model = Polygon

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)


class PolygonAdd(FeatureAdd):
    model = Polygon
    geojson_url = 'polygon_geojson'


class PolygonUpdate(FeatureUpdate):
    model = Polygon
    geojson_url = 'polygon_geojson'


class PolygonGeoJSONView(BaseDetailView, GeoJSONMixin):
    model = Polygon

    def get_queryset(self):
        # GeoJSON expects an iterable
        return Polygon.objects.filter(pk=self.kwargs['pk'])


class SuccessView(TemplateView):
    """
    Generic view to say "hey, you have made this action success".
    Should be splitted in the future.
    """
    template_name = "chickpea/success.html"


class CategoryCreate(CreateView):
    model = Category
    form_class = CategoryForm

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)

    def get_context_data(self, **kwargs):
        kwargs.update({
            'action_url': reverse_lazy('category_add', kwargs={'map_id': self.kwargs['map_id']})
        })
        return super(CategoryCreate, self).get_context_data(**kwargs)

    def get_initial(self):
        initial = super(CategoryCreate, self).get_initial()
        map_inst = get_object_or_404(Map, pk=self.kwargs['map_id'])
        initial.update({
            "map": map_inst
        })
        return initial

    def form_valid(self, form):
        self.object = form.save()
        return simple_json_response(category=self.object.json)


class CategoryUpdate(UpdateView):
    model = Category
    form_class = CategoryForm

    def render_to_response(self, context, **response_kwargs):
        return render_to_json(self.get_template_names(), response_kwargs, context, self.request)

    def get_context_data(self, **kwargs):
        kwargs.update({
            'action_url': reverse_lazy('category_update', kwargs={'map_id': self.kwargs['map_id'], 'pk': self.object.pk})
        })
        return super(CategoryUpdate, self).get_context_data(**kwargs)

    def form_valid(self, form):
        self.object = form.save()
        return simple_json_response(category=self.object.json)
