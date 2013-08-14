/*
* FormHelpers
*/
L.Storage.FormHelper = L.Class.extend({

    initialize: function (map, form_id, options) {
        this.initOptions(options);
        this.map = map;
        this.form_id = form_id;
        this.form = L.DomUtil.get(form_id);
        if (typeof this.onsubmit === "function") {
            L.DomEvent.on(this.form, "submit", this.onsubmit, this);
        }
        this.initForm();
        for (var i=0, l=this.form.elements.length; i<l; i++) {
            this.initElement(this.form.elements[i]);
        }
    },

    initOptions: function (options) {
        this.options = L.Util.extend({}, options);
        this.defaultOptions = L.Util.extend({}, options);
    },

    getOption: function (option) {
        return this.options[option] || this.defaultOptions[option];
    },

    initForm: function () {
        // hook
    },

    initElement: function (element) {
        this["element_" + element.name] = element;
        if (typeof this["init_" + element.name] === "function") {
            this["init_" + element.name]();
        }
        var events = ['change', 'click', 'focus', 'blur', 'input'];
        for (var idx in events) {
            this.addEventListener(element, events[idx]);
        }
    },

    addEventListener: function (element, type) {
        var self = this,
            listenerName = "on_" + element.name + "_" + type,
            keyName = '_storage_on_' + type;
        if (typeof this[listenerName] === "function") {
            if (typeof element[keyName] === "undefined") {
                element[keyName] = [];
            }
            element[keyName].push({
                event: self[listenerName],
                context: self
            });
        }
        element["on" + type] = function () {
            self.fireEvent(element, type);
        };
    },

    fireEvent: function (element, type) {
        var keyName = '_storage_on_' + type;
        if (!element[keyName]) {
            return;
        }
        for (var idx in element[keyName]) {
            element[keyName][idx].event.call(element[keyName][idx].context);
        }
    },

    unselectAll: function (container) {
        var els = container.querySelectorAll('div.selected');
        for (var el in els) {
            if (els.hasOwnProperty(el)) {
                L.DomUtil.removeClass(els[el], "selected");
            }
        }
    }

});


L.Storage.FormHelper.ImportURL = L.Storage.FormHelper.extend({

    onsubmit: function (e) {
        var replace = {
            bbox: this.map.getBounds().toBBoxString(),
            north: this.map.getBounds().getNorthEast().lat,
            east: this.map.getBounds().getNorthEast().lng,
            south: this.map.getBounds().getSouthWest().lat,
            west: this.map.getBounds().getNorthEast().lng,
            lat: this.map.getCenter().lat,
            lng: this.map.getCenter().lng,
            zoom: this.map.getZoom()
        };
        replace['left'] = replace['west'];
        replace['bottom'] = replace['south'];
        replace['right'] = replace['east'];
        replace['top'] = replace['north'];
        this.element_data_url.value = L.Util.template(this.element_data_url.value, replace);
    }

});

L.Storage.ElementHelper = L.Class.extend({
    includes: [L.Mixin.Events],

    initialize: function (formBuilder, field) {
        this.formBuilder = formBuilder;
        this.form = this.formBuilder.form;
        this.field = field;
        this.fieldEls = this.field.split('.');
        this.name = this.fieldEls[this.fieldEls.length-1];
        this.build();
    },

    get: function () {
        return this.cast(this.formBuilder.getter(this.field));
    },

    cast: function (value) {
        return value;
    },

    sync: function () {
        this.set();
        this.fire('synced');
    },

    set: function () {
        this.formBuilder.setter(this.field, this.value());
    },

    buildLabel: function () {
        this.label = L.DomUtil.create('label', '', this.formBuilder.form);
        this.label.innerHTML = this.name;
    }

});

L.Storage.ElementHelper.Input = L.S.ElementHelper.extend({

    build: function () {
        this.buildLabel();
        this.input = L.DomUtil.create('input', '', this.formBuilder.form);
        this.input.value = this.backup = this.get() || null;
        this.input.type = this.guessType();
        this.input.name = this.label.innerHTML = this.name;
        this.input._helper = this;
        L.DomEvent.on(this.input, 'input', this.sync, this);
    },

    guessType: function () {
        return 'text';
    },

    value: function () {
        return this.input.value;
    }
});

L.S.ElementHelper.ColorPicker = L.S.ElementHelper.Input.extend({
    colors: [
        "Black", "Navy", "DarkBlue", "MediumBlue", "Blue", "DarkGreen",
        "Green", "Teal", "DarkCyan", "DeepSkyBlue", "DarkTurquoise",
        "MediumSpringGreen", "Lime", "SpringGreen", "Aqua", "Cyan",
        "MidnightBlue", "DodgerBlue", "LightSeaGreen", "ForestGreen",
        "SeaGreen", "DarkSlateGray", "DarkSlateGrey", "LimeGreen",
        "MediumSeaGreen", "Turquoise", "RoyalBlue", "SteelBlue",
        "DarkSlateBlue", "MediumTurquoise", "Indigo", "DarkOliveGreen",
        "CadetBlue", "CornflowerBlue", "MediumAquaMarine", "DimGray",
        "DimGrey", "SlateBlue", "OliveDrab", "SlateGray", "SlateGrey",
        "LightSlateGray", "LightSlateGrey", "MediumSlateBlue", "LawnGreen",
        "Chartreuse", "Aquamarine", "Maroon", "Purple", "Olive", "Gray",
        "Grey", "SkyBlue", "LightSkyBlue", "BlueViolet", "DarkRed",
        "DarkMagenta", "SaddleBrown", "DarkSeaGreen", "LightGreen",
        "MediumPurple", "DarkViolet", "PaleGreen", "DarkOrchid",
        "YellowGreen", "Sienna", "Brown", "DarkGray", "DarkGrey",
        "LightBlue", "GreenYellow", "PaleTurquoise", "LightSteelBlue",
        "PowderBlue", "FireBrick", "DarkGoldenRod", "MediumOrchid",
        "RosyBrown", "DarkKhaki", "Silver", "MediumVioletRed", "IndianRed",
        "Peru", "Chocolate", "Tan", "LightGray", "LightGrey", "Thistle",
        "Orchid", "GoldenRod", "PaleVioletRed", "Crimson", "Gainsboro",
        "Plum", "BurlyWood", "LightCyan", "Lavender", "DarkSalmon",
        "Violet", "PaleGoldenRod", "LightCoral", "Khaki", "AliceBlue",
        "HoneyDew", "Azure", "SandyBrown", "Wheat", "Beige", "WhiteSmoke",
        "MintCream", "GhostWhite", "Salmon", "AntiqueWhite", "Linen",
        "LightGoldenRodYellow", "OldLace", "Red", "Fuchsia", "Magenta",
        "DeepPink", "OrangeRed", "Tomato", "HotPink", "Coral", "DarkOrange",
        "LightSalmon", "Orange", "LightPink", "Pink", "Gold", "PeachPuff",
        "NavajoWhite", "Moccasin", "Bisque", "MistyRose", "BlanchedAlmond",
        "PapayaWhip", "LavenderBlush", "SeaShell", "Cornsilk",
        "LemonChiffon", "FloralWhite", "Snow", "Yellow", "LightYellow",
        "Ivory", "White"
    ],

    build: function () {
        L.S.ElementHelper.Input.prototype.build.call(this);
        this.input.placeholder = L._('Inherit');
        this.container = L.DomUtil.create('div', 'storage-color-picker');
        this.container.style.display = "none";
        this.input.parentNode.insertBefore(this.container, this.input.nextSibling);
        for (var idx in this.colors) {
            this.addColor(this.colors[idx]);
        }
        this.spreadColor();
        this.input.autocomplete = "off";
        L.DomEvent.on(this.input, 'focus', this.onFocus, this);
        L.DomEvent.on(this.input, 'blur', this.onBlur, this);
        L.DomEvent.on(this.input, 'change', this.onChange, this);
        L.DomEvent.off(this.input, 'input', this.sync, this);
        L.DomEvent.on(this.input, 'input', this.onChange, this);
    },

    onFocus: function () {
        this.container.style.display = "block";
    },

    onBlur: function () {
        var self = this,
            closePicker = function () {
                self.container.style.display = "none";
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
            this.input.style.backgroundColor = "inherit";
        }
    },

    addColor: function (colorName) {
        var span = L.DomUtil.create('span', '', this.container);
        span.style.backgroundColor = span.title = colorName;
        var updateColorInput = function (e) {
            this.input.value = colorName;
            this.onChange();
            this.container.style.display = "none";
        };
        L.DomEvent.on(span, "mousedown", updateColorInput, this);
    }

});

L.S.ElementHelper.SelectAbstract = L.S.ElementHelper.extend({

    selectOptions: [
        "value", "label"
    ],

    build: function () {
        this.buildLabel();
        this.select = L.DomUtil.create('select', '', this.form);
        this.buildOptions();
        L.DomEvent.on(this.select, 'change', this.sync, this);
    },

    buildOptions: function (options) {
        options = options || this.selectOptions;
        for (var i=0, l=options.length; i<l; i++) {
            this.buildOption(options[i][0], options[i][1]);
        }
    },

    buildOption: function (value, label) {
        var option = L.DomUtil.create('option', '', this.select);
        option.value = value;
        option.innerHTML = label;
        if (this.get() === value) {
            option.selected = "selected";
        }
    },

    value: function () {
        return this.cast(this.select[this.select.selectedIndex].value);
    }

});

L.S.ElementHelper.IconClassSwitcher = L.S.ElementHelper.SelectAbstract.extend({

    selectOptions: [
        [undefined, L._('inherit')],
        ["Default", L._('Default')],
        ["Circle", L._('Circle')],
        ["Drop", L._('Drop')],
        ["Ball", L._('Ball')]
    ],

    cast: function (value) {
        switch(value) {
            case "Default":
            case "Circle":
            case "Drop":
            case "Ball":
                break;
            default:
                value = undefined;
        }
        return value;
    }

});

L.S.ElementHelper.NullableBoolean = L.S.ElementHelper.SelectAbstract.extend({
    selectOptions: [
        [undefined, L._('inherit')],
        [true, L._('yes')],
        [false, L._('no')]
    ],

    cast: function (value) {
        switch (value) {
            case "true":
            case true:
                value = true;
                break;
            case "false":
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

    guessType: function () {
        return "hidden";
    },

    build: function () {
        L.S.ElementHelper.Input.prototype.build.call(this);
        this.parentContainer = L.DomUtil.create('div', 'storage-form-iconfield', this.form);
        this.headerContainer = L.DomUtil.create("div", "", this.parentContainer);
        this.pictogramsContainer = L.DomUtil.create("div", "storage-pictogram-list", this.parentContainer);
        this.input.type = "hidden";
        this.label.style.display = "none";
        this.button = L.DomUtil.create('a', 'button', this.form);
        var self = this;
        this.button.innerHTML = L._('Change symbol');
        this.button.href = "#";
        L.DomEvent
            .on(this.button, "click", L.DomEvent.stop)
            .on(this.button, "click", this.fetch, this);
    },

    addIconPreview: function (pictogram) {
        var baseClass = "storage-icon-choice",
            value = pictogram.src,
            className = value === this.value() ? baseClass + " selected" : baseClass,
            container = L.DomUtil.create('div', className, this.pictogramsContainer),
            img = L.DomUtil.create('img', '', container);
        img.src = pictogram.src;
        img.title = pictogram.name + " — © " + pictogram.attribution;
        L.DomEvent.on(container, "click", function (e) {
            this.input.value = value;
            this.sync();
            this.unselectAll(container);
            L.DomUtil.addClass(container, "selected");
        }, this);
    },

    empty: function () {
        this.input.value = "";
        this.unselectAll(this.pictogramsContainer);
        this.sync();
    },

    fetch: function (e) {
        var self = this;
        L.Storage.Xhr.get(this.formBuilder.obj.map.options.urls.pictogram_list_json, {
            callback: function (data) {
                self.pictogramsContainer.innerHTML = "";
                var title = L.DomUtil.create('h5', '', self.pictogramsContainer);
                title.innerHTML = L._("Choose a symbol");
                for (var idx in data.pictogram_list) {
                    self.addIconPreview(data.pictogram_list[idx]);
                }
                var deleteButton = L.DomUtil.create("a", "", self.pictogramsContainer);
                deleteButton.innerHTML = L._('Remove icon symbol');
                deleteButton.href = "#";
                deleteButton.style.display = "block";
                deleteButton.style.clear = "both";
                L.DomEvent
                    .on(deleteButton, "click", L.DomEvent.stop)
                    .on(deleteButton, "click", self.empty, this);
            }
        });
    }

});


L.Storage.FormBuilder = L.Class.extend({

    initialize: function (obj, fields, options) {
        this.obj = obj;
        this.fields = fields;
        this.form = L.DomUtil.create('form');
        this.helpers = {};
        this.options = options || {};
    },

    build: function () {
        this.form.innerHTML = "";
        for (var idx in this.fields) {
            this.buildField(this.fields[idx]);
        }
        return this.form;
    },

    buildField: function (field) {
        var type, helper;
        if (field instanceof Array) {
            type = field[1];
            field = field[0];
        } else {
            type = "Input";
        }
        if (L.S.ElementHelper[type]) {
            helper = new L.S.ElementHelper[type](this, field);
        } else {
            console.log('No element helper for ' + type);
            return;
        }
        this.helpers[field] = helper;
        helper.on('synced', function () {
            if (this.options.callback) {
                this.options.callback.call(this.callbackContext || this.obj);
            }
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
                obj[what] = value;
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
    }

});