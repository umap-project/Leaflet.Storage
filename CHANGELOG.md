# Leaflet.Storage changelog

## dev
- allow colon in properties to be consumed in popupTemplate

## 0.7.5
- upgrade osmtogeojson to 2.1.0
- localize and proxy dataUrl parameter

## 0.7.3
- add tooltip when drawing
- import multiple files at a time
- added Chinese (Taiwan) locale
- fixed right-click on path vertex not working propertly when editing

## 0.7.1
- upgrade Leaflet.Editable to 0.2.0
- fixed some bugs after Leaflet.Editable switch

## 0.7.0
- introduce panel popup mode
- upgraded leaflet.loading to 0.1.10
- make the cluster text color dynamic
- fix missing icons for transorm to polygon/polyline actions
- add a slideshow mode
- make possible to set cluster color by hand
- make possible to manage showLabel from layer and map
- basic kml/gpx download support
- MultiLineString are merged at import
- catch setMaxBounds errors (when using useless bounds)
- first version of a table editor
- it's now possible to cancel every mouse action of a polygon
  (useful when using them as background)
- simple custom popup templates
- more control over map data attribution (custom inputs added)
- basic HTTP optimistic concurrency control
- add "empty" button in limit bounds fieldset
- make possible to decide which properties the data browser will filter on
- add "datalayers" query string parameter to override shown datalayers on map load
- add edit fieldset for changing marker latlng by hand
- moved from Leaflet.Draw to Leaflet.Editable

## 0.6.x
- add TMS option to custom tilelayer
- allow to define default properties at map level
- support iframe in text formatting
- fix bug where polygon export were adding a point
- make that only visible elements are downloaded
- iframe export helper
- add Leaflet.label (for marker only atm)
- GeoRSS support
- heatmap support, thanks to https://github.com/Leaflet/Leaflet.heat
- added optional caption bar
- added new "large" popup template 
- added a button to empty a layer without deleting it
- added a button to clone a datalayer
- added dataUrl and dataFormat on map creation page
- basic support for GeometryCollection import
- removed submodules and switched to grunt for assets management

## 0.5.x
- datalayers are now sent to backend as geojson
- there is now a global "save" button, and also a "cancel changes"
- added a contextmenu, thanks to https://github.com/aratcliffe/Leaflet.contextmenu
- added a loader, thanks to https://github.com/ebrelsford/Leaflet.loading
- import are processed client side, thanks to https://github.com/mapbox/csv2geojson
  and https://github.com/mapbox/togeojson
- download is handled client side
- option "outlink" as been added, to open external URL on polygon click
- edit shortcuts has been added (Ctrl-E to toggle edit status, Ctrl-S to save, etc.)
- links in popup now open in a now window
- possibility to add custom icon symbols
- new option to clusterize markers, thanks to https://github.com/Leaflet/Leaflet.markercluster
- remote data option added to datalayer: this will fetch data from a given URL
  instead of from the local database
- popup window can now display a table with all features properties
- support of OSM XML format, thanks to https://github.com/tyrasd/osmtogeojson
- added a measure control, thanks to https://github.com/makinacorpus/Leaflet.MeasureControl
- added Transifex config
- simple help boxes
- it's now possible to set background layer with manual settings
- add an edit button in the data browser (when in edit mode)
- add icon URL formatting with feature properties
- add "Transform to Polygon/Polyline" action
- new link on contextmenu to open external routing service from clicked point
- fix bug where features were duplicated when datalayer was deleted then reverted
- add layer action to databrowser
- add optional default CSS
- allow to close panel by ctrl-Enter when editing in textarea
- add management for map max bounds
- add Ctrl-Z for canceling changes

## 0.4.x
- add a data browser
- add a popup footer with navigation between features
- some work on IE compat
- new tilelayer visual switcher
- Spanish translation, thanks to @ikks

## 0.3.x

- add a setting to display map caption on map load (cf #50)
- add nl translation
- update to Leaflet 0.6-dev and Leaflet.Draw 0.2


## 0.2.0

- handle auth from popup
- add a control for map settings management
- move to Leaflet 0.5
- move to Leaflet.draw 0.1.6
- default tooltip has now a fixed position
- make just drown polys editable
- handle path styling option (https://github.com/yohanboniface/Leaflet.Storage/issues/26)
- add an UI to manage icon style and picto (https://github.com/yohanboniface/django-leaflet-storage/issues/22)
- icon style and picto are now manageable also on Markers (https://github.com/yohanboniface/django-leaflet-storage/issues/21)
- add Leaflet.EditInOSM plugin in options
- add a scale control (optional)
- add an optional minimap (with Leaflet.MiniMap plugin)

## 0.1.0

- first packaged version
