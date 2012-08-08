# -*- coding: utf-8 -*-

from chickpea.base_models import (Category, Map, TileLayer, Icon,
                                  MapToTileLayer, get_model)

# Marker is the only model configurable for now
Marker = get_model("Marker")
Polyline = get_model("Polyline")
