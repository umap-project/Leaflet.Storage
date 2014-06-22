L.Storage.ElementHelper = L.Class.extend({
    includes: [L.Mixin.Events],

    initialize: function (formBuilder, field, options) {
        this.formBuilder = formBuilder;
        this.obj = this.formBuilder.obj;
        this.map = this.obj.getMap();
        this.form = this.formBuilder.form;
        this.field = field;
        this.options = options;
        this.fieldEls = this.field.split('.');
        this.name = this.formBuilder.getName(field);
        this.buildLabel();
        this.build();
        this.buildHelpText();
    },

    get: function () {
        return this.formBuilder.getter(this.field);
    },

    toHTML: function () {
        return this.get();
    },

    toJS: function () {
        return this.value();
    },

    sync: function () {
        this.set();
        this.fire('synced');
    },

    set: function () {
        this.formBuilder.setter(this.field, this.toJS());
    },

    buildLabel: function () {
        if (this.options.label) {
            this.label = L.DomUtil.add('label', '', this.formBuilder.form, this.options.label);
            if (this.options.helpEntries) {
                this.map.help.button(this.label, this.options.helpEntries);
            }
        }
    },

    buildHelpText: function () {
        if (this.options.helpText) {
            var container = L.DomUtil.create('small', 'help-text', this.form);
            container.innerHTML = this.options.helpText;
        }
    },

    fetch: function () {}

});

L.S.ElementHelper.Textarea = L.S.ElementHelper.extend({

    build: function () {
        this.input = L.DomUtil.create('textarea', '', this.form);
        this.fetch();
        L.DomEvent.on(this.input, 'input', this.sync, this);
        L.DomEvent.on(this.input, 'keypress', this.onKeyPress, this);
    },

    fetch: function () {
        var value = this.backup = this.toHTML();
        if (value) {
            this.input.value = value;
        }
    },

    value: function () {
        return this.input.value;
    },

    onKeyPress: function (e) {
        var key = e.keyCode,
            ENTER = 13;
        if (key == ENTER && (e.shiftKey || e.ctrlKey)) {
            L.DomEvent.stop(e);
            L.S.fire('ui:end');
        }
    }

});

L.Storage.ElementHelper.Input = L.S.ElementHelper.extend({

    build: function () {
        if (this.options.wrapper) {
            this.wrapper = L.DomUtil.create(this.options.wrapper, this.options.wrapperClass || '', this.form);
        }
        this.input = L.DomUtil.create('input', '', this.wrapper || this.form);
        this.input.type = this.type();
        this.input.name = this.name;
        this.input._helper = this;
        this.fetch();
        if (this.options.placeholder) {
            this.input.placeholder = this.options.placeholder;
        }
        L.DomEvent.on(this.input, this.getSyncEvent(), this.sync, this);
        L.DomEvent.on(this.input, 'keydown', this.onKeyDown, this);
    },

    fetch: function () {
        this.input.value = this.backup = (typeof this.toHTML() !== 'undefined' ? this.toHTML() : null);
    },

    getSyncEvent: function () {
        return 'input';
    },

    type: function () {
        return 'text';
    },

    value: function () {
        return this.input.value || undefined;
    },

    finish: function () {
        L.S.fire('ui:end');
    },

    onKeyDown: function (e) {
        var key = e.keyCode;
        if (key == L.S.Keys.ENTER) {
            L.DomEvent.stop(e);
            this.finish();
        }
        if (key == L.S.Keys.S && e.ctrlKey) {
            this.finish();
        }
    }

});

L.S.ElementHelper.BlurInput = L.S.ElementHelper.Input.extend({

    getSyncEvent: function () {
        return 'blur';
    },

    finish: function () {
        this.sync();
        L.S.ElementHelper.Input.prototype.finish.call(this);
    },

    sync: function () {
        if (this.backup !== this.value()) {
            L.S.ElementHelper.Input.prototype.sync.call(this);
        }
    }

});

L.S.ElementHelper.IntegerMixin = {

    value: function () {
        return !isNaN(this.input.value) && this.input.value !== '' ? parseInt(this.input.value, 10): undefined;
    },

    type: function () {
        return 'number';
    }

};

L.S.ElementHelper.IntInput = L.S.ElementHelper.Input.extend({
    includes: [L.S.ElementHelper.IntegerMixin]
});


L.S.ElementHelper.BlurIntInput = L.S.ElementHelper.BlurInput.extend({
    includes: [L.S.ElementHelper.IntegerMixin]
});


L.S.ElementHelper.FloatMixin = {

    value: function () {
        return !isNaN(this.input.value) && this.input.value !== '' ? parseFloat(this.input.value): undefined;
    },

    type: function () {
        return 'number';
    }

};

L.S.ElementHelper.FloatInput = L.S.ElementHelper.Input.extend({
    includes: [L.S.ElementHelper.FloatMixin]
});

L.S.ElementHelper.BlurFloatInput = L.S.ElementHelper.BlurInput.extend({
    includes: [L.S.ElementHelper.FloatMixin]
});


L.S.ElementHelper.ColorPicker = L.S.ElementHelper.Input.extend({
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
        L.S.ElementHelper.Input.prototype.build.call(this);
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

L.S.ElementHelper.TextColorPicker = L.S.ElementHelper.ColorPicker.extend({
    colors: [
        'Black', 'DarkSlateGrey', 'DimGrey', 'SlateGrey', 'LightSlateGrey',
        'Grey', 'DarkGrey', 'LightGrey', 'White'
    ]

});

L.S.ElementHelper.CheckBox = L.S.ElementHelper.extend({

    build: function () {
        var container = L.DomUtil.create('div', 'formbox', this.form);
        this.input = L.DomUtil.create('input', '', container);
        this.input.type = 'checkbox';
        this.input.name = this.name;
        this.input._helper = this;
        this.fetch();
        L.DomEvent.on(this.input, 'change', this.sync, this);
    },

    fetch: function () {
        this.backup = this.toHTML();
        this.input.checked = this.backup === true;
    },

    value: function () {
        return this.input.checked;
    },

    toHTML: function () {
        return [1, true].indexOf(this.get()) !== -1;
    }

});

L.S.ElementHelper.SelectAbstract = L.S.ElementHelper.extend({

    selectOptions: [
        ['value', 'label']
    ],

    build: function () {
        this.select = L.DomUtil.create('select', '', this.form);
        this.select.name = this.name;
        this.validValues = [];
        this.buildOptions();
        L.DomEvent.on(this.select, 'change', this.sync, this);
    },

    getOptions: function () {
        return this.selectOptions;
    },

    fetch: function () {
        this.buildOptions();
    },

    buildOptions: function () {
        this.select.innerHTML = '';
        var options = this.getOptions();
        for (var i=0, l=options.length; i<l; i++) {
            this.buildOption(options[i][0], options[i][1]);
        }
    },

    buildOption: function (value, label) {
        this.validValues.push(value);
        var option = L.DomUtil.create('option', '', this.select);
        option.value = value;
        option.innerHTML = label;
        if (this.toHTML() === value) {
            option.selected = 'selected';
        }
    },

    value: function () {
        return this.select[this.select.selectedIndex].value;
    },

    getDefault: function () {
        return this.getOptions()[0][0];
    },

    toJS: function () {
        var value = this.value();
        if (this.validValues.indexOf(value) !== -1) {
            return value;
        } else {
            return this.getDefault();
        }
    }


});

L.S.ElementHelper.IconClassSwitcher = L.S.ElementHelper.SelectAbstract.extend({

    selectOptions: [
        [undefined, L._('inherit')],
        ['Default', L._('Default')],
        ['Circle', L._('Circle')],
        ['Drop', L._('Drop')],
        ['Ball', L._('Ball')]
    ]

});

L.S.ElementHelper.PopupTemplate = L.S.ElementHelper.SelectAbstract.extend({

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
        var value = L.S.ElementHelper.SelectAbstract.prototype.toJS.apply(this);
        if (value === 'table') { value = 'Table'; }
        return value;
    }

});

L.S.ElementHelper.LayerTypeChooser = L.S.ElementHelper.SelectAbstract.extend({

    selectOptions: [
        ['Default', L._('Default')],
        ['Cluster', L._('Clustered')],
        ['Heat', L._('Heatmap')],
    ]

});

L.S.ElementHelper.DataLayerSwitcher = L.S.ElementHelper.SelectAbstract.extend({

    getOptions: function () {
        var options = [];
        this.map.eachDataLayer(function (datalayer) {
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
        return this.map.datalayers[this.value()];
    },

    set: function () {
        this.obj.changeDataLayer(this.toJS());
    }

});

L.S.ElementHelper.onLoadPanel = L.S.ElementHelper.SelectAbstract.extend({

    selectOptions: [
        ['none', L._('None')],
        ['caption', L._('Caption')],
        ['databrowser', L._('Data browser')]
    ]

});

L.S.ElementHelper.DataFormat = L.S.ElementHelper.SelectAbstract.extend({

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

L.S.ElementHelper.LicenceChooser = L.S.ElementHelper.SelectAbstract.extend({

    getOptions: function () {
        var licences = [],
            licencesList = this.formBuilder.obj.options.licences,
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
        return this.formBuilder.obj.options.licences[this.value()];
    }

});

L.S.ElementHelper.NullableBoolean = L.S.ElementHelper.SelectAbstract.extend({
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

L.S.ElementHelper.IconUrl = L.S.ElementHelper.Input.extend({

    type: function () {
        return 'hidden';
    },

    build: function () {
        L.S.ElementHelper.Input.prototype.build.call(this);
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
        this.map.get(this.map.options.urls.pictogram_list_json, {
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
                this.map.help.button(customButton, 'formatIconURL');
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

L.S.ElementHelper.Url = L.S.ElementHelper.Input.extend({

    type: function () {
        return 'url';
    }

});

L.Storage.FormBuilder = L.Class.extend({

    initialize: function (obj, fields, options) {
        this.obj = obj;
        this.fields = fields;
        this.form = L.DomUtil.create('form', 'storage-form');
        this.helpers = {};
        this.options = options || {};
        if (this.options.id) {
            this.form.id = this.options.id;
        }
        if (this.options.className) {
            L.DomUtil.addClass(this.form, this.options.className);
        }
    },

    build: function () {
        this.form.innerHTML = '';
        for (var idx in this.fields) {
            this.buildField(this.fields[idx]);
        }
        return this.form;
    },

    buildField: function (field) {
        var type, helper, options;
        if (field instanceof Array) {
            options = field[1] || {};
            helpText = field[2] || null;
            field = field[0];
        } else {
            options = this.defaultOptions[this.getName(field)] || {};
        }
        type = options.handler || 'Input';
        if (L.S.ElementHelper[type]) {
            helper = new L.S.ElementHelper[type](this, field, options);
        } else {
            console.error('No element helper for ' + type);
            return;
        }
        this.helpers[field] = helper;
        helper.on('synced', function () {
            if (this.options.callback) {
                this.options.callback.call(this.options.callbackContext || this.obj, field);
            }
            this.obj.fire('synced', {field: field});
        }, this);
        // L.DomEvent.on(input, 'keydown', function (e) {
        //     var key = e.keyCode,
        //         ESC = 27;
        //     if (key === ESC) {
        //         this.resetField(field);
        //         L.DomEvent.stop(e);
        //     }
        // }, this);
    },

    getter: function (field) {
        var path = field.split('.'),
            value = this.obj;
        for (var i=0, l=path.length; i<l; i++) {
            value = value[path[i]];
        }
        return value;
    },

    setter: function (field, value) {
        var path = field.split('.'),
            obj = this.obj,
                what;
        for (var i=0, l=path.length; i<l; i++) {
            what = path[i];
            if (what === path[l-1]) {
                if (typeof value === 'undefined') {
                    delete obj[what];
                } else {
                    obj[what] = value;
                }
            } else {
                obj = obj[what];
            }
        }
        this.obj.isDirty = true;
    },

    resetField: function (field) {
        var backup = this.backup[field],
            input = this.inputs[field];
        input.value = backup;
        this.setter(field, backup);
    },

    getName: function (field) {
        var fieldEls = field.split('.');
        return fieldEls[fieldEls.length-1];
    },

    fetchAll: function () {
        for (var key in this.helpers) {
            if (this.helpers.hasOwnProperty(key)) {
                this.helpers[key].fetch();
            }
        }
    },

    syncAll: function () {
        for (var key in this.helpers) {
            if (this.helpers.hasOwnProperty(key)) {
                this.helpers[key].sync();
            }
        }
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
    }

});
