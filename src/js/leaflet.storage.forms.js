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
        var events = ['change', 'click', 'focus', 'blur'];
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

L.Storage.FormHelper.IconField = L.Storage.FormHelper.extend({

    iconClasses: ["Default", "Circle", "Drop", "Ball"],

    initForm: function () {
        this.parentContainer = L.DomUtil.get('storage-form-iconfield');
        this.headerContainer = L.DomUtil.create("div", "", this.parentContainer);
        this.shapesContainer = L.DomUtil.create("div", "storage-icon-list", this.parentContainer);
        this.pictogramsContainer = L.DomUtil.create("div", "storage-pictogram-list", this.parentContainer);
        this.iconContainer =  L.DomUtil.create('div', "storage-icon-choice", this.headerContainer);
    },

    populateTableList: function (container, input, element, value) {
        var baseClass = "storage-icon-choice";
        var className = value == input.value ? baseClass + " selected" : baseClass;
        var iconContainer = L.DomUtil.create('div', className, container);
        iconContainer.appendChild(element);
        L.DomEvent.on(iconContainer, "click", function (e) {
            input.value = value;
            input.onchange();
            this.unselectAll(container);
            L.DomUtil.addClass(iconContainer, "selected");
        }, this);
    },

    createIcon: function (iconClass, iconUrl, iconColor) {
        var icon = new L.Storage.Icon[iconClass](this.map);
        icon.options.color = iconColor;
        icon.options.iconUrl = iconUrl;
        icon = icon.createIcon();
        icon.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(new L.Point(0, 50));
        return icon;
    },

    initDemoIcon: function () {
        var iconElement = this.createIcon(this.getOption("iconClass"), this.getOption("iconUrl"), this.getOption("iconColor"));
        this.iconContainer.innerHTML = "";
        this.iconContainer.appendChild(iconElement);
    },

    init_icon_class: function () {
        var self = this;
        this.initDemoIcon();
        this.buttonsContainer = L.DomUtil.create('div', '', this.headerContainer);
        this.buttonsContainer.style.float = "left";
        var changeClassButton = L.DomUtil.create('a', '', this.buttonsContainer);
        changeClassButton.innerHTML = L._('Change shape');
        changeClassButton.href = "#";
        changeClassButton.style.display = "block";
        var addShape = function (_iconClass) {
            var icon = self.createIcon(_iconClass, self.options.iconUrl, self.options.iconColor);
            self.populateTableList(self.shapesContainer, self.element_icon_class, icon, _iconClass);
        };
        var removeShape = function () {
            self.element_icon_class.value = "";
            self.element_icon_class.onchange();
            self.unselectAll(self.shapesContainer);
        };
        L.DomEvent
            .on(changeClassButton, "click", L.DomEvent.stop)
            .on(changeClassButton, "click", function (e) {
                this.shapesContainer.innerHTML = "";
                this.pictogramsContainer.innerHTML = "";
                var title = L.DomUtil.create('h5', '', this.shapesContainer);
                title.innerHTML = L._("Choose a shape");
                for (var idx in this.iconClasses) {
                    addShape(this.iconClasses[idx]);
                }
                var deleteButton = L.DomUtil.create("a", "storage-delete-button", self.shapesContainer);
                deleteButton.innerHTML = L._('Remove icon shape');
                deleteButton.href = "#";
                deleteButton.style.display = "block";
                deleteButton.style.clear = "both";
                L.DomEvent
                    .on(deleteButton, "click", L.DomEvent.stop)
                    .on(deleteButton, "click", removeShape);
            }, this);
    },

    init_pictogram: function () {
        var changePictoButton = L.DomUtil.create('a', '', this.buttonsContainer),
            self = this;
        changePictoButton.innerHTML = L._('Change symbol');
        changePictoButton.style.display = "block";
        changePictoButton.href = "#";
        var addPictogram = function (pictogram) {
            var img = L.DomUtil.create('img', '');
            img.src = pictogram.src;
            img.title = pictogram.name + " — © " + pictogram.attribution;
            self.populateTableList(self.pictogramsContainer, self.element_pictogram, img, pictogram.id);
        };
        var removePictogram = function () {
            self.element_pictogram.value = "";
            self.element_pictogram.onchange();
            self.unselectAll(self.pictogramsContainer);
        };
        var retrievePictograms = function (e) {
            L.Storage.Xhr.get(self.map.options.urls.pictogram_list_json, {
                callback: function (data) {
                    var pictogram;
                    self.pictograms = {};
                    self.pictogramsContainer.innerHTML = "";
                    self.shapesContainer.innerHTML = "";
                    var title = L.DomUtil.create('h5', '', self.pictogramsContainer);
                    title.innerHTML = "Choose a symbol";
                    for (var idx in data.pictogram_list) {
                        pictogram = data.pictogram_list[idx];
                        self.pictograms[pictogram.id] = pictogram;
                        addPictogram(pictogram);
                    }
                    var deleteButton = L.DomUtil.create("a", "", self.pictogramsContainer);
                    deleteButton.innerHTML = L._('Remove icon symbol');
                    deleteButton.href = "#";
                    deleteButton.style.display = "block";
                    deleteButton.style.clear = "both";
                    L.DomEvent
                        .on(deleteButton, "click", L.DomEvent.stop)
                        .on(deleteButton, "click", removePictogram);
                }
            });
        };
        L.DomEvent
            .on(changePictoButton, "click", L.DomEvent.stop)
            .on(changePictoButton, "click", retrievePictograms);
    },

    on_color_change: function () {
        this.options.iconColor = this.element_color.value;
        this.initDemoIcon();
    },

    on_pictogram_change: function () {
        if (this.element_pictogram.value) {
            this.options.iconUrl = this.pictograms[this.element_pictogram.value].src;
        }
        else {
            this.options.iconUrl = null;
        }
        this.initDemoIcon();
    },

    on_icon_class_change: function () {
        this.options.iconClass = this.element_icon_class.value;
        this.initDemoIcon();
    }
});

L.Storage.FormHelper.Color = L.Storage.FormHelper.extend({
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

    init_color: function () {
        this.container = L.DomUtil.create('div', 'storage-color-picker');
        this.container.style.display = "none";
        this.element_color.parentNode.insertBefore(this.container, this.element_color.nextSibling);
        for (var idx in this.colors) {
            this.addColor(this.colors[idx]);
        }
        this.on_color_change();
    },

    on_color_focus: function () {
        this.container.style.display = "block";
    },

    on_color_blur: function () {
        var self = this,
            closePicker = function () {
            self.container.style.display = "none";
        };
        // We must leave time for the click to be listened
        window.setTimeout(closePicker, 100);
    },

    on_color_change: function () {
        this.options.color = this.element_color.value;
        this.element_color.style.backgroundColor = this.getOption('color');
    },

    addColor: function (colorName) {
            var span = L.DomUtil.create('span', '', this.container);
            span.style.backgroundColor = colorName;
            span.title = colorName;
            var updateColorInput = function (e) {
                this.element_color.value = colorName;
                this.options.color = colorName;
                this.element_color.onchange();
                this.container.style.display = "none";
            };
            L.DomEvent.on(span, "mousedown", updateColorInput, this);
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