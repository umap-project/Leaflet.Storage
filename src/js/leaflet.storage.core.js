/* Poor man pub/sub handler, enough for now */

L.StorageSingleton = L.Class.extend({
    includes: L.Mixin.Events,
    version: '0.1.0'
});
L.Storage = new L.StorageSingleton();
L.S = L.Storage;

/*
* Global events
*/
L.S._onKeyDown = function (e) {
    var key = e.keyCode,
        ESC = 27;
    if (key == ESC) {
        L.S.fire('ui:end');
    }
};
L.DomEvent.addListener(document, 'keydown', L.S._onKeyDown, L.S);

/*
* i18n
*/
L.S.locales = {};
L.S.locale = null;
L.S.registerLocale = function registerLocale(code, locale) {
    L.S.locales[code] = L.Util.extend({}, L.S.locales[code], locale);
};
L.S.setLocale = function setLocale(code) {
    L.S.locale = code;
};
L.S.i18n = L.S._ = function translate(string, data) {
    if (L.S.locale && L.S.locales[L.S.locale] && L.S.locales[L.S.locale][string]) {
        string = L.S.locales[L.S.locale][string];
    }
    try {
        // Do not fail if some data is missing
        // a bad translation should not break the app
        string = L.Util.template(string, data);
    }
    catch (err) {/*pass*/}

    return string;
};

/*
* FormUtils
*/
L.Storage.FormUtil = {

    unselectAll: function (container) {
        var els = container.querySelectorAll('div.selected');
        for (var el in els) {
            if (els.hasOwnProperty(el)) {
                L.DomUtil.removeClass(els[el], "selected");
            }
        }
    },

    addIconElementInList: function (container, input, element, value) {
        var baseClass = "storage-icon-choice";
        var className = value == input.value ? baseClass + " selected" : baseClass;
        var icon_container = L.DomUtil.create('div', className, container);
        icon_container.appendChild(element);
        L.DomEvent.on(icon_container, "click", function (e) {
            input.value = value;
            L.Storage.FormUtil.unselectAll(container);
            L.DomUtil.addClass(icon_container, "selected");
        });
    },

    listenIconClassField: function (map) {
        var icons = ["Default", "Circle", "Drop", "Ball"],
            container = L.DomUtil.get('storage-demo-marker'),
            input = L.DomUtil.get('id_icon_class');
        var createIcon = function (iconClass) {
            var icon = new L.Storage.Icon[iconClass](map);
            icon = icon.createIcon();
            icon.style.transform = L.DomUtil.getTranslateString(new L.Point(0, 50));
            L.Storage.FormUtil.addIconElementInList(container, input, icon, iconClass);
        };
        for (var idx in icons) {
            createIcon(icons[idx]);
        }
    },

        listenIconImageField: function (map) {
        var container = L.DomUtil.get('storage-demo-pictogram'),
            input = L.DomUtil.get('id_pictogram'),
            baseClass = "storage-icon-choice",
            button = L.DomUtil.create("a", "", container);
        button.innerHTML = L.S._('Change icon image');
        button.href = "#";
        button.style.display = "block";
        var createPictogram = function (pictogram) {
            var img = L.DomUtil.create('img', '');
            img.src = pictogram.src;
            img.title = pictogram.name + " — © " + pictogram.attribution;
            L.Storage.FormUtil.addIconElementInList(container, input, img, pictogram.id);
        };
        var removePictogram = function () {
            input.value = "";
            L.Storage.FormUtil.unselectAll(container);
        };
        var fn = function (e) {
            L.Storage.Xhr.get(map.options.urls.pictogram_list_json, {
                callback: function (data) {
                    for (var idx in data.pictogram_list) {
                        createPictogram(data.pictogram_list[idx]);
                    }
                    delete_button = L.DomUtil.create("a", "", container);
                    delete_button.innerHTML = L.S._('Remove icon image');
                    delete_button.href = "#";
                    delete_button.style.display = "block";
                    delete_button.style.clear = "both";
                    L.DomEvent
                        .on(delete_button, "click", L.DomEvent.stop)
                        .on(delete_button, "click", removePictogram);
                }
            });
        };
        L.DomEvent
            .on(button, "click", L.DomEvent.stop)
            .on(button, "click", fn);
    }
};
