L.Util.Xhr = {
    _ajax: function (verb, uri, options) {
        var default_options = {
            'async': true,
            'callback': null,
            'responseType': "text",
            'data': null,
            'dataType': 'json'
        };
        settings = L.Util.extend({}, default_options, options);

        var xhr = new XMLHttpRequest();
        xhr.open(verb, uri, settings.async);
        // xhr.responseType = "text"; Does not work

        xhr.onload = function(e) {
            if (this.status == 200) {
                var raw = this.response;
                if (settings.dataType == "json") {
                    raw = JSON.parse(raw);
                }
                if (settings.callback) {
                    settings.callback(raw);
                } else {
                    // Default JSON callback
                    if (settings.dataType == "json") {
                        if (raw.redirect) {
                            window.location = raw.redirect;
                        }
                        else if (raw.info) {
                            L.Chickpea.fire("alert", {"content": raw.info, "level": "info"});
                        }
                        else if (raw.error) {
                            L.Chickpea.fire("alert", {"content": raw.error, "level": "error"});
                        }
                        else if (raw.html) {
                            L.Chickpea.fire('modal_ready', {'data': raw});
                        }
                    }
                }
            }
        };

        xhr.send(settings.data);
    },

    get: function(uri, options) {
        L.Util.Xhr._ajax("GET", uri, options);
    },

    post: function(uri, options) {
        L.Util.Xhr._ajax("POST", uri, options);
    },

    submit_form: function(form_id, options) {
        if(typeof options == "undefined") {
            options = {};
        }
        var form = L.DomUtil.get(form_id);
        var formData = new FormData(form);
        if(options.extraFormData) {
            formData.append(options.extraFormData);
        }
        options.data = formData;
        L.Util.Xhr.post(form.action, options);
        return false;
    },

    listen_form: function (form_id, options) {
        var form = L.DomUtil.get(form_id);
        L.DomEvent
            .on(form, 'submit', L.DomEvent.stopPropagation)
            .on(form, 'submit', L.DomEvent.preventDefault)
            .on(form, 'submit', function (e) {
                L.Util.Xhr.submit_form(form_id, options);
            });
    }

};