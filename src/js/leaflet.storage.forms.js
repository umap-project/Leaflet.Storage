
L.FormBuilder.ColorPicker = L.FormBuilder.Input.extend({
    colors: [
        'Black', 'Navy', 'DarkBlue', 'MediumBlue', 'Blue', 'DarkGreen',
        'Green', 'Teal', 'DarkCyan', 'DeepSkyBlue', 'DarkTurquoise',
        'MediumSpringGreen', 'Lime', 'SpringGreen', 'Aqua', 'Cyan',
        'MidnightBlue', 'DodgerBlue', 'LightSeaGreen', 'ForestGreen',
        'SeaGreen', 'DarkSlateGray', 'DarkSlateGrey', 'LimeGreen',
        'MediumSeaGreen', 'Turquoise', 'RoyalBlue', 'SteelBlue',
        'DarkSlateBlue', 'MediumTurquoise', 'Indigo', 'DarkOliveGreen',
        'CadetBlue', 'CornflowerBlue', 'MediumAquaMarine', 'DimGray',
        'DimGrey', 'SlateBlue', 'OliveDrab', 'SlateGray', 'SlateGrey',
        'LightSlateGray', 'LightSlateGrey', 'MediumSlateBlue', 'LawnGreen',
        'Chartreuse', 'Aquamarine', 'Maroon', 'Purple', 'Olive', 'Gray',
        'Grey', 'SkyBlue', 'LightSkyBlue', 'BlueViolet', 'DarkRed',
        'DarkMagenta', 'SaddleBrown', 'DarkSeaGreen', 'LightGreen',
        'MediumPurple', 'DarkViolet', 'PaleGreen', 'DarkOrchid',
        'YellowGreen', 'Sienna', 'Brown', 'DarkGray', 'DarkGrey',
        'LightBlue', 'GreenYellow', 'PaleTurquoise', 'LightSteelBlue',
        'PowderBlue', 'FireBrick', 'DarkGoldenRod', 'MediumOrchid',
        'RosyBrown', 'DarkKhaki', 'Silver', 'MediumVioletRed', 'IndianRed',
        'Peru', 'Chocolate', 'Tan', 'LightGray', 'LightGrey', 'Thistle',
        'Orchid', 'GoldenRod', 'PaleVioletRed', 'Crimson', 'Gainsboro',
        'Plum', 'BurlyWood', 'LightCyan', 'Lavender', 'DarkSalmon',
        'Violet', 'PaleGoldenRod', 'LightCoral', 'Khaki', 'AliceBlue',
        'HoneyDew', 'Azure', 'SandyBrown', 'Wheat', 'Beige', 'WhiteSmoke',
        'MintCream', 'GhostWhite', 'Salmon', 'AntiqueWhite', 'Linen',
        'LightGoldenRodYellow', 'OldLace', 'Red', 'Fuchsia', 'Magenta',
        'DeepPink', 'OrangeRed', 'Tomato', 'HotPink', 'Coral', 'DarkOrange',
        'LightSalmon', 'Orange', 'LightPink', 'Pink', 'Gold', 'PeachPuff',
        'NavajoWhite', 'Moccasin', 'Bisque', 'MistyRose', 'BlanchedAlmond',
        'PapayaWhip', 'LavenderBlush', 'SeaShell', 'Cornsilk',
        'LemonChiffon', 'FloralWhite', 'Snow', 'Yellow', 'LightYellow',
        'Ivory', 'White'
    ],

    build: function () {
        L.FormBuilder.Input.prototype.build.call(this);
        this.input.placeholder = this.options.placeholder || L._('Inherit');
        this.container = L.DomUtil.create('div', 'storage-color-picker');
        this.container.style.display = 'none';
        this.input.parentNode.insertBefore(this.container, this.input.nextSibling);
        for (var idx in this.colors) {
            this.addColor(this.colors[idx]);
        }
        this.spreadColor();
        this.input.autocomplete = 'off';
        L.DomEvent.on(this.input, 'focus', this.onFocus, this);
        L.DomEvent.on(this.input, 'blur', this.onBlur, this);
        L.DomEvent.on(this.input, 'change', this.onChange, this);
        L.DomEvent.off(this.input, 'input', this.sync, this);
        L.DomEvent.on(this.input, 'input', this.onChange, this);
    },

    onFocus: function () {
        this.container.style.display = 'block';
    },

    onBlur: function () {
        var self = this,
            closePicker = function () {
                self.container.style.display = 'none';
            };
        // We must leave time for the click to be listened
        window.setTimeout(closePicker, 100);
    },

    onChange: function () {
        this.spreadColor();
        this.sync();
    },

    spreadColor: function () {
        if (this.input.value) {
            this.input.style.backgroundColor = this.input.value;
        } else {
            this.input.style.backgroundColor = 'inherit';
        }
    },

    addColor: function (colorName) {
        var span = L.DomUtil.create('span', '', this.container);
        span.style.backgroundColor = span.title = colorName;
        var updateColorInput = function () {
            this.input.value = colorName;
            this.onChange();
            this.container.style.display = 'none';
        };
        L.DomEvent.on(span, 'mousedown', updateColorInput, this);
    }

});

L.FormBuilder.TextColorPicker = L.FormBuilder.ColorPicker.extend({
    colors: [
        'Black', 'DarkSlateGrey', 'DimGrey', 'SlateGrey', 'LightSlateGrey',
        'Grey', 'DarkGrey', 'LightGrey', 'White'
    ]

});

L.FormBuilder.IconClassSwitcher = L.FormBuilder.Select.extend({

    selectOptions: [
        [undefined, L._('inherit')],
        ['Default', L._('Default')],
        ['Circle', L._('Circle')],
        ['Drop', L._('Drop')],
        ['Ball', L._('Ball')]
    ]

});

L.FormBuilder.PopupTemplate = L.FormBuilder.Select.extend({

    selectOptions: [
        [undefined, L._('inherit')],
        ['Default', L._('Name and description')],
        ['Large', L._('Name and description (large)')],
        ['Table', L._('Table')],
        ['GeoRSSImage', L._('GeoRSS (title + image)')],
        ['GeoRSSLink', L._('GeoRSS (only link)')],
        ['SimplePanel', L._('Side panel')]
    ],

    toJS: function () {
        var value = L.FormBuilder.Select.prototype.toJS.apply(this);
        if (value === 'table') { value = 'Table'; }
        return value;
    }

});

L.FormBuilder.LayerTypeChooser = L.FormBuilder.Select.extend({

    selectOptions: [
        ['Default', L._('Default')],
        ['Cluster', L._('Clustered')],
        ['Heat', L._('Heatmap')]
    ]

});

L.FormBuilder.DataLayerSwitcher = L.FormBuilder.Select.extend({

    getOptions: function () {
        var options = [];
        this.builder.map.eachDataLayer(function (datalayer) {
            if(datalayer.isLoaded() && !datalayer.isRemoteLayer() && datalayer.isBrowsable()) {
                options.push([L.stamp(datalayer), datalayer.getName()]);
            }
        });
        return options;
    },

    toHTML: function () {
        return L.stamp(this.obj.datalayer);
    },

    toJS: function () {
        return this.builder.map.datalayers[this.value()];
    },

    set: function () {
        this.obj.changeDataLayer(this.toJS());
    }

});

L.FormBuilder.onLoadPanel = L.FormBuilder.Select.extend({

    selectOptions: [
        ['none', L._('None')],
        ['caption', L._('Caption')],
        ['databrowser', L._('Data browser')]
    ]

});

L.FormBuilder.DataFormat = L.FormBuilder.Select.extend({

    selectOptions: [
        [undefined, L._('Choose the data format')],
        ['geojson', 'geojson'],
        ['osm', 'osm'],
        ['csv', 'csv'],
        ['gpx', 'gpx'],
        ['kml', 'kml'],
        ['georss', 'georss']
    ]

});

L.FormBuilder.LicenceChooser = L.FormBuilder.Select.extend({

    getOptions: function () {
        var licences = [],
            licencesList = this.builder.obj.options.licences,
            licence;
        for (var i in licencesList) {
            licence = licencesList[i];
            licences.push([i, licence.name]);
        }
        return licences;
    },

    toHTML: function () {
        return this.get().name;
    },

    toJS: function () {
        return this.builder.obj.options.licences[this.value()];
    }

});

L.FormBuilder.NullableBoolean = L.FormBuilder.Select.extend({
    selectOptions: [
        [undefined, L._('inherit')],
        [true, L._('yes')],
        [false, L._('no')]
    ],

    toJS: function () {
        var value = this.value();
        switch (value) {
            case 'true':
            case true:
                value = true;
                break;
            case 'false':
            case false:
                value = false;
                break;
            default:
                value = undefined;
        }
        return value;
    }

});

L.FormBuilder.IconUrl = L.FormBuilder.Input.extend({

    type: function () {
        return 'hidden';
    },

    build: function () {
        L.FormBuilder.Input.prototype.build.call(this);
        this.parentContainer = L.DomUtil.create('div', 'storage-form-iconfield', this.form);
        this.buttonsContainer = L.DomUtil.create('div', '', this.parentContainer);
        this.pictogramsContainer = L.DomUtil.create('div', 'storage-pictogram-list', this.parentContainer);
        this.input.type = 'hidden';
        this.input.placeholder = L._('Url');
        this.createButtonsBar();
    },

    createButtonsBar: function () {
        if (this.value() && this.value().indexOf('{') == -1) { // Do not try to render URL with variables
            var img = L.DomUtil.create('img', '', L.DomUtil.create('div', 'storage-icon-choice', this.buttonsContainer));
            img.src = this.value();
            L.DomEvent.on(img, 'click', this.fetchIconList, this);
        }
        this.button = L.DomUtil.create('a', '', this.buttonsContainer);
        this.button.innerHTML = this.value() ? L._('Change symbol') : L._('Add symbol');
        this.button.href = '#';
        L.DomEvent
            .on(this.button, 'click', L.DomEvent.stop)
            .on(this.button, 'click', this.fetchIconList, this);
    },

    addIconPreview: function (pictogram) {
        var baseClass = 'storage-icon-choice',
            value = pictogram.src,
            className = value === this.value() ? baseClass + ' selected' : baseClass,
            container = L.DomUtil.create('div', className, this.pictogramsContainer),
            img = L.DomUtil.create('img', '', container);
        img.src = value;
        if (pictogram.name && pictogram.attribution) {
            img.title = pictogram.name + ' — © ' + pictogram.attribution;
        }
        L.DomEvent.on(container, 'click', function (e) {
            this.input.value = value;
            this.sync();
            this.unselectAll(this.pictogramsContainer);
            L.DomUtil.addClass(container, 'selected');
            this.pictogramsContainer.innerHTML = '';
            this.createButtonsBar();
        }, this);
    },

    empty: function () {
        this.input.value = '';
        this.unselectAll(this.pictogramsContainer);
        this.sync();
        this.pictogramsContainer.innerHTML = '';
        this.createButtonsBar();
    },

    fetchIconList: function (e) {
        this.builder.map.get(this.builder.map.options.urls.pictogram_list_json, {
            callback: function (data) {
                this.pictogramsContainer.innerHTML = '';
                this.buttonsContainer.innerHTML = '';
                var title = L.DomUtil.create('h5', '', this.pictogramsContainer);
                title.innerHTML = L._('Choose a symbol');
                for (var idx in data.pictogram_list) {
                    this.addIconPreview(data.pictogram_list[idx]);
                }
                var deleteButton = L.DomUtil.create('a', '', this.pictogramsContainer);
                deleteButton.innerHTML = L._('Remove icon symbol');
                deleteButton.href = '#';
                deleteButton.style.display = 'block';
                deleteButton.style.clear = 'both';
                L.DomEvent
                    .on(deleteButton, 'click', L.DomEvent.stop)
                    .on(deleteButton, 'click', this.empty, this);
                var cancelButton = L.DomUtil.create('a', '', this.pictogramsContainer);
                cancelButton.innerHTML = L._('Cancel');
                cancelButton.href = '#';
                cancelButton.style.display = 'block';
                cancelButton.style.clear = 'both';
                L.DomEvent
                    .on(cancelButton, 'click', L.DomEvent.stop)
                    .on(cancelButton, 'click', function (e) {
                        this.pictogramsContainer.innerHTML = '';
                        this.createButtonsBar();
                    }, this);
                var customButton = L.DomUtil.create('a', '', this.pictogramsContainer);
                customButton.innerHTML = L._('Custom');
                customButton.href = '#';
                customButton.style.display = 'block';
                customButton.style.clear = 'both';
                this.builder.map.help.button(customButton, 'formatIconURL');
                L.DomEvent
                    .on(customButton, 'click', L.DomEvent.stop)
                    .on(customButton, 'click', function (e) {
                        this.input.type = 'url';
                        this.pictogramsContainer.innerHTML = '';
                    }, this);
            },
            context: this
        });
    },

    unselectAll: function (container) {
        var els = container.querySelectorAll('div.selected');
        for (var el in els) {
            if (els.hasOwnProperty(el)) {
                L.DomUtil.removeClass(els[el], 'selected');
            }
        }
    }

});

L.FormBuilder.Url = L.FormBuilder.Input.extend({

    type: function () {
        return 'url';
    }

});

L.Storage.FormBuilder = L.FormBuilder.extend({

    options: {
        className: 'storage-form'
    },

    defaultOptions: {
        name: {label: L._('name')},
        description: {label: L._('description'), handler: 'Textarea', helpEntries: 'textFormatting'},
        color: {handler: 'ColorPicker', label: L._('color'), helpText: L._('Must be a CSS valid name (eg.: DarkBlue or #123456)')},
        opacity: {label: L._('opacity'), helpText: L._('Opacity, from 0.1 to 1.0 (opaque).')},
        stroke: {handler: 'NullableBoolean', label: L._('stroke'), helpText: L._('Whether to display or not the Polygon path.')},
        weight: {label: L._('weight'), helpText: L._('Path weight in pixels. From 0 to 10.')},
        fill: {handler: 'NullableBoolean', label: L._('fill'), helpText: L._('Whether to fill the path with color.')},
        fillColor: {handler: 'ColorPicker', label: L._('fill color'), helpText: L._('Optional. Same as color if not set.')},
        fillOpacity: {label: L._('fill opacity'), helpText: L._('Fill opacity, from 0.1 to 1.0 (opaque).')},
        smoothFactor: {label: L._('smooth factor'), helpText: L._('How much to simplify the polyline on each zoom level (more = better performance and smoother look, less = more accurate)')},
        dashArray: {label: L._('dash array'), helpText: L._('A string that defines the stroke dash pattern. Ex.: «5, 10, 15».')},
        iconClass: {handler: 'IconClassSwitcher', label: L._('type of icon')},
        iconUrl: {handler: 'IconUrl', label: L._('symbol of the icon')},
        popupTemplate: {handler: 'PopupTemplate', label: L._('template to use for the popup')},
        popupContentTemplate: {label: L._('Popup content template'), handler: 'Textarea', helpEntries: ['dynamicProperties', 'textFormatting'], helpText: L._('You can use formatting and &#123;properties&#125; from your features.'), placeholder: '# {name}'},
        datalayer: {handler: 'DataLayerSwitcher', label: L._('Choose the layer of the feature')},
        moreControl: {handler: 'CheckBox', helpText: L._('Do you want to display the «more» control?')},
        datalayersControl: {handler: 'CheckBox', helpText: L._('Do you want to display the data layers control?')},
        zoomControl: {handler: 'CheckBox', helpText: L._('Do you want to display zoom control?')},
        scrollWheelZoom: {handler: 'CheckBox', helpText: L._('Allow scroll wheel zoom?')},
        miniMap: {handler: 'CheckBox', helpText: L._('Do you want to display a minimap?')},
        scaleControl: {handler: 'CheckBox', helpText: L._('Do you want to display the scale control?')},
        onLoadPanel: {handler: 'onLoadPanel', helpText: L._('Do you want to display a panel on load?')},
        displayPopupFooter: {handler: 'CheckBox', helpText: L._('Do you want to display popup footer?')},
        captionBar: {handler: 'CheckBox', helpText: L._('Do you want to display a caption bar?')},
        zoomTo: {handler: 'IntInput', placeholder: L._('Inherit'), helpText: L._('Zoom level for automatic zooms')},
        showLabel: {handler: 'NullableBoolean', helpText: L._('Add a permanent label')}
    },

    initialize: function (obj, fields, options) {
        this.map = obj.getMap();
        L.FormBuilder.prototype.initialize.call(this, obj, fields, options);
        this.on('finish', this.finish);
    },

    setter: function (field, value) {
        L.FormBuilder.prototype.setter.call(this, field, value);
        this.obj.isDirty = true;
    },

    finish: function () {
        L.S.fire('ui:end');
    },

    buildField: function (field) {
        var helper = L.FormBuilder.prototype.buildField.call(this, field);
        if (helper.options.helpEntries) {
            this.map.help.button(helper.label, helper.options.helpEntries);
        }
        return helper;
    }

});
