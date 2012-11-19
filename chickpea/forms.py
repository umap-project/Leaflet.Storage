from django import forms
from django.template.defaultfilters import slugify
from django.contrib.gis.geos import Point

from chickpea.models import Map


class QuickMapCreateForm(forms.ModelForm):

    # center and slug must be set as not required for this form
    center = forms.CharField(required=False, widget=forms.HiddenInput())
    slug = forms.CharField(required=False, widget=forms.HiddenInput())

    class Meta:
        model = Map
        fields = ('name', 'description', 'slug', 'center')

    def clean_slug(self):
        slug = self.cleaned_data.get('slug', None)
        name = self.cleaned_data.get('name', None)
        if not slug and name:
            # If name is empty, don't do nothing, validation will raise
            # later on the process because name is required
            self.cleaned_data['slug'] = slugify(name)
            return self.cleaned_data['slug']
        else:
            return ""

    def clean_center(self):
        if not self.cleaned_data['center']:
            point = Point(5, 45)
            self.cleaned_data['center'] = point
        return self.cleaned_data['center']


class UpdateMapExtentForm(forms.ModelForm):

    class Meta:
        model = Map
        fields = ('zoom', 'center')
