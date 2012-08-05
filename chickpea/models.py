# -*- coding: utf-8 -*-

from chickpea.registry import get_model
from chickpea.base_models import Category, Map, TileLayer, Icon, MapToTileLayer

# Marker is the only model configurable for now
Marker = get_model("Marker")
