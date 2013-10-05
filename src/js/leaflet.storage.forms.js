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
        this.label = L.DomUtil.create('label', '', this.formBuilder.form);
        this.label.innerHTML = this.name;
    }

});

L.Storage.ElementHelper.Input = L.S.ElementHelper.extend({

    build: function () {
        this.buildLabel();
        this.input = L.DomUtil.create('input', '', this.formBuilder.form);
        this.input.value = this.backup = this.toHTML() || null;
        this.input.type = this.guessType();
        this.input.name = this.label.innerHTML = this.name;
        this.input._helper = this;
        L.DomEvent.on(this.input, 'input', this.sync, this);
        L.DomEvent.on(this.input, 'keypress', this.onKeyPress, this);
    },

    guessType: function () {
        return 'text';
    },

    value: function () {
        return this.input.value;
    },

    onKeyPress: function (e) {
        var key = e.keyCode,
            ENTER = 13;
        if (key == ENTER) {
            L.S.fire('ui:end');
        }
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

L.S.ElementHelper.CheckBox = L.S.ElementHelper.extend({

    build: function () {
        this.buildLabel();
        this.input = L.DomUtil.create('input', '', this.form);
        this.backup = this.get();
        this.input.checked = this.backup === true;
        this.input.type = "checkbox";
        this.input.name = this.label.innerHTML = this.name;
        this.input._helper = this;
        L.DomEvent.on(this.input, 'change', this.sync, this);
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
        "value", "label"
    ],

    build: function () {
        this.buildLabel();
        this.select = L.DomUtil.create('select', '', this.form);
        this.buildOptions();
        L.DomEvent.on(this.select, 'change', this.sync, this);
    },

    getOptions: function () {
        return this.selectOptions;
    },

    buildOptions: function (options) {
        options = options || this.getOptions();
        for (var i=0, l=options.length; i<l; i++) {
            this.buildOption(options[i][0], options[i][1]);
        }
    },

    buildOption: function (value, label) {
        var option = L.DomUtil.create('option', '', this.select);
        option.value = value;
        option.innerHTML = label;
        if (this.toHTML() === value) {
            option.selected = "selected";
        }
    },

    value: function () {
        return this.select[this.select.selectedIndex].value;
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

    toJS: function () {
        var value = this.value();
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

    toJS: function (value) {
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
            this.unselectAll(this.pictogramsContainer);
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


L.Storage.FormBuilder = L.Class.extend({

    initialize: function (obj, fields, options) {
        this.obj = obj;
        this.fields = fields;
        this.form = L.DomUtil.create('form', 'storage-form');
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