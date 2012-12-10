L.Util.Xhr = {
    // supports only JSON as response data type
    _ajax: function (verb, uri, options) {
        var args = arguments,
            self = this;
        var default_options = {
            'async': true,
            'callback': null,
            'responseType': "text",
            'data': null
        };
        settings = L.Util.extend({}, default_options, options);

        var xhr = new XMLHttpRequest();
        xhr.open(verb, uri, settings.async);
        // xhr.responseType = "text"; Does not work

        xhr.onload = function(e) {
            if (this.status == 200) {
                var data;
                try {
                    data = JSON.parse(this.response);
                }
                catch (err) {
                    console.log(err);
                    L.Chickpea.fire("alert", {"content": "Problem in the response format", "level": "error"});
                }
                if (data.login_required) {
                    // login_required should be an URL for the login form
                    if (settings.login_callback) {
                        settings.login_callback(data);
                    }
                    else {
                        self.login(data, args);
                    }
                }
                else {
                    if (settings.callback) {
                        settings.callback(data);
                    } else {
                        // default callback, to avoid boilerplate
                        if (data.redirect) {
                            window.location = data.redirect;
                        }
                        else if (data.info) {
                            L.Chickpea.fire("alert", {"content": data.info, "level": "info"});
                        }
                        else if (data.error) {
                            L.Chickpea.fire("alert", {"content": data.error, "level": "error"});
                        }
                        else if (data.html) {
                            L.Chickpea.fire('modal_ready', {'data': data});
                        }
                    }
                }
            }
            else {
                L.Chickpea.fire("alert", {"content": "Problem in the response", "level": "error"});
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
    },

    login: function (data, args) {
        // data.html: login form
        // args: args of the first _ajax call, to call again at process end
        var self = this;
        var ask_for_login = function (data) {
            L.Chickpea.fire('modal_ready', {'data': data});
            L.Util.Xhr.listen_form('login_form', {
                'callback': function (data) {
                    if (data.html) {
                        // Problem in the login
                        self.login(data, args);
                    }
                    else {
                        L.Util.Xhr._ajax.apply(self, args);
                    }
                }
            });
        };
        if (data.login_required) {
            this.get(data.login_required, {
                'callback': function (data) {
                    ask_for_login(data);
                }
            });
        }
        else {
            ask_for_login(data);
        }
    }

};