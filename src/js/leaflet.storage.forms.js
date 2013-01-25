/*
* FormUtils
*/
L.Storage.FormListener = L.Class.extend({

    initialize: function (map, form_id, options) {
        this.options = options;
        this.map = map;
        this.form_id = form_id;
        this.form = L.DomUtil.get(form_id);
        this.initForm();
        for (var idx in this.form.elements) {
            if (this.form.elements.hasOwnProperty(idx)) {
                this.initElement(this.form.elements[idx]);
            }
        }
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
        var self = this;
        var listenerName = "on_" + element.name + "_" + type;
        if (typeof this[listenerName] === "function") {
            element["on" + type] = function () {
                self[listenerName].call(self);
            };
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

L.Storage.FormListener.IconField = L.Storage.FormListener.extend({

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
            this.initDemoIcon();
            this.unselectAll(container);
            L.DomUtil.addClass(iconContainer, "selected");
        }, this);
    },

    createIcon: function (iconClass, iconUrl, iconColor) {
        var icon = new L.Storage.Icon[iconClass](this.map);
        icon.options.color = iconColor;
        icon.options.iconUrl = iconUrl;
        icon = icon.createIcon();
        icon.style.transform = L.DomUtil.getTranslateString(new L.Point(0, 50));
        return icon;
    },

    initDemoIcon: function () {
        var iconElement = this.createIcon(this.options.iconClass, this.options.iconUrl, this.options.iconColor);
        this.iconContainer.innerHTML = "";
        this.iconContainer.appendChild(iconElement);
    },

    init_icon_class: function () {
        var self = this;
        this.initDemoIcon();
        this.buttonsContainer = L.DomUtil.create('div', '', this.headerContainer);
        this.buttonsContainer.style.float = "left";
        var changeClassButton = L.DomUtil.create('a', '', this.buttonsContainer);
        changeClassButton.innerHTML = L.S._('Change shape');
        changeClassButton.href = "#";
        changeClassButton.style.display = "block";
        var addIcon = function (_iconClass) {
            var icon = self.createIcon(_iconClass, self.options.iconUrl, self.options.iconColor);
            self.populateTableList(self.shapesContainer, self.element_icon_class, icon, _iconClass);
        };
        L.DomEvent
            .on(changeClassButton, "click", L.DomEvent.stop)
            .on(changeClassButton, "click", function (e) {
                this.shapesContainer.innerHTML = "";
                this.pictogramsContainer.innerHTML = "";
                var title = L.DomUtil.create('h5', '', this.shapesContainer);
                title.innerHTML = "Choose a shape";
                for (var idx in this.iconClasses) {
                    addIcon(this.iconClasses[idx]);
                }
            }, this);
    },

    init_pictogram: function () {
        var changePictoButton = L.DomUtil.create('a', '', this.buttonsContainer),
            self = this;
        changePictoButton.innerHTML = L.S._('Change symbol');
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
            self.unselectAll(container);
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
                    deleteButton.innerHTML = L.S._('Remove icon symbol');
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

    on_options_color_change: function () {
        if (this.element_options_color.value) {
            this.options.iconColor = this.element_options_color.value;
        }
        this.initDemoIcon();
    },

    on_pictogram_change: function () {
        if (this.element_options_color.value) {
            this.options.iconUrl = this.pictograms[this.element_pictogram.value].src;
        }
        this.initDemoIcon();
    },

    on_icon_class_change: function () {
        if (this.element_icon_class.value) {
            this.options.iconClass = this.element_icon_class.value;
        }
        this.initDemoIcon();
    }
});
