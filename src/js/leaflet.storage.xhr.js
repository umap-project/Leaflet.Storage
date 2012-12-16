L.Storage.Xhr = {
    // supports only JSON as response data type
    _ajax: function (verb, uri, options) {
        var args = arguments,
            self = this;
        var default_options = {
            'async': true,
            'callback': null,
            'responseType': "text",
            'data': null,
            'listen_form': null // optional form to listen in default callback
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
                    L.Storage.fire("alert", {"content": "Problem in the response format", "level": "error"});
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
                        self.default_callback(data, settings);
                    }
                }
            }
            else if (this.status == 403) {
                L.Storage.fire("alert", {"content": "Action not allowed :(", "level": "error"});
            }
            else {
                L.Storage.fire("alert", {"content": "Problem in the response", "level": "error"});
            }
        };

        xhr.send(settings.data);
    },

    get: function(uri, options) {
        L.Storage.Xhr._ajax("GET", uri, options);
    },

    post: function(uri, options) {
        L.Storage.Xhr._ajax("POST", uri, options);
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
        L.Storage.Xhr.post(form.action, options);
        return false;
    },

    listen_form: function (form_id, options) {
        var form = L.DomUtil.get(form_id);
        L.DomEvent
            .on(form, 'submit', L.DomEvent.stopPropagation)
            .on(form, 'submit', L.DomEvent.preventDefault)
            .on(form, 'submit', function (e) {
                L.Storage.Xhr.submit_form(form_id, options);
            });
    },

    default_callback: function (data, options) {
        // default callback, to avoid boilerplate
        if (data.redirect) {
            window.location = data.redirect;
        }
        else if (data.info) {
            L.Storage.fire("alert", {"content": data.info, "level": "info"});
            L.Storage.fire('modal_close');
        }
        else if (data.error) {
            L.Storage.fire("alert", {"content": data.error, "level": "error"});
        }
        else if (data.html) {
            L.Storage.fire('modal_ready', {'data': data});
            // To low boilerplate, if there is a form, listen it
            if (options.listen_form) {
                // Listen form again
                listen_options = L.Util.extend({}, options, options.listen_form.options);
                L.Storage.Xhr.listen_form(options.listen_form.id, listen_options);
            }
        }
    },

    login: function (data, args) {
        // data.html: login form
        // args: args of the first _ajax call, to call again at process end
        var self = this;
        var ask_for_login = function (data) {
            L.Storage.fire('modal_ready', {'data': data});
            L.Storage.Xhr.listen_form('login_form', {
                'callback': function (data) {
                    if (data.html) {
                        // Problem in the login
                        self.login(data, args);
                    }
                    else {
                        if (typeof args !== "undefined") {
                            L.Storage.Xhr._ajax.apply(self, args);
                        }
                        else {
                            self.default_callback(data, {});
                        }
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
    },

    logout: function(url) {
        this.get(url);
    }

};