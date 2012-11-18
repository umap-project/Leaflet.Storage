L.Util.Xhr = {
    _ajax: function (verb, uri, options) {
        var default_options = {
            'async': true,
            'callback': null,
            'responseType': "text",
            'data': null
        }
        settings = L.Util.extend({}, default_options, options);

        var xhr = new XMLHttpRequest();
        xhr.open(verb, uri, settings.async);
        // xhr.responseType = "text"; Does not work

        xhr.onload = function(e) {
            if (this.status == 200) {
                if (settings.callback) {
                    var raw = this.response;
                    if (settings.dataType == "json") {
                        raw = JSON.parse(raw);
                    }
                    settings.callback(raw);
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
        options['dataType'] = "json";
        var form = L.DomUtil.get(form_id);
        var formData = new FormData(form);
        if(options.extraFormData) {
            formData.append(options.extraFormData);
        }
        options.data = formData;
        L.Util.Xhr.post(form.action, options);
        return false;
    }
};