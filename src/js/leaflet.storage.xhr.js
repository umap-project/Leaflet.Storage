L.Storage.Xhr = {

    _wrapper: function () {
        var wrapper;
        if (window.XMLHttpRequest === undefined) {
            wrapper = function() {
                try {
                    return new window.ActiveXObject('Microsoft.XMLHTTP.6.0');
                }
                catch (e1) {
                    try {
                        return new window.ActiveXObject('Microsoft.XMLHTTP.3.0');
                    }
                    catch (e2) {
                        throw new Error('XMLHttpRequest is not supported');
                    }
                }
            };
        }
        else {
            wrapper = window.XMLHttpRequest;
        }
        return new wrapper();
    },

    _ajax: function (settings) {
        var xhr = this._wrapper(), id = Math.random(), self = this;
        if (settings.listener) settings.listener.fire('dataloading', {id: id});
        xhr.open(settings.verb, settings.uri, true);
        if (settings.uri.indexOf('http') !== 0 || settings.uri.indexOf(window.location.origin) === 0) {
            // "X-" mode headers cause the request to be in preflight mode,
            // we don"t want that by default for CORS requests
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        }
        if (settings.headers) {
            for (var name in settings.headers) {
                xhr.setRequestHeader(name, settings.headers[name]);
            }
        }

        var loaded = function () {if (settings.listener) settings.listener.fire('dataload', {id: id});};

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status == 200) {
                    settings.callback.call(settings.context || xhr, xhr.responseText, xhr);
                }
                else if (xhr.status === 403) {
                    L.Storage.fire('ui:alert', {content: L._('Action not allowed :('), level: 'error'});
                }
                else if (xhr.status === 412) {
                    var msg = L._('Woops! Someone else seems to have edited the data. You can save anyway, but this will erase the changes made by others.');
                    var actions = [
                        {
                            label: L._('Save anyway'),
                            callback: function () {
                                delete settings.headers['If-Match'];
                                self._ajax(settings);
                            },
                            callbackContext: self
                        },
                        {
                            label: L._('Cancel')
                        }
                    ];
                    L.Storage.fire('ui:alert', {content: msg, level: 'error', duration: 100000, actions: actions});
                }
                else {
                    if (xhr.status !== 0) {  // 0 === request cut by user
                        L.Storage.fire('ui:alert', {'content': L._('Problem in the response'), 'level': 'error'});
                    }
                }
                loaded();
            }
        };

        try {
            xhr.send(settings.data);
        } catch (e) {
            // Pass
            loaded();
            console.error('Bad Request', e);
        }
    },

    // supports only JSON as response data type
    _json: function (verb, uri, options) {
        var args = arguments,
            self = this;
        var default_options = {
            'async': true,
            'callback': null,
            'responseType': 'text',
            'data': null,
            'listen_form': null // optional form to listen in default callback
        };
        var settings = L.Util.extend({}, default_options, options);

        if (verb === 'POST') {
            // find a way not to make this django specific
            var token = document.cookie.replace(/(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, '$1');
            if (token) {
                settings.headers = settings.headers || {};
                settings.headers['X-CSRFToken'] = token;
            }
        }

        var callback = function(responseText, response) {
            var data;
            try {
                data = JSON.parse(responseText);
            }
            catch (err) {
                console.log(err);
                L.Storage.fire('ui:alert', {content: L._('Problem in the response format'), level: 'error'});
                return;
            }
            if (data.errors) {
                console.log(data.errors);
                L.Storage.fire('ui:alert', {content: L._('An error occured'), level: 'error'});
            } else if (data.login_required) {
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
                    L.bind(settings.callback, settings.context || this)(data, response);
                } else {
                    self.default_callback(data, settings, response);
                }
            }
        };

        this._ajax({
            verb: verb,
            uri: uri,
            data: settings.data,
            callback: callback,
            headers: settings.headers,
            listener: settings.listener
        });
    },

    get: function(uri, options) {
        L.Storage.Xhr._json('GET', uri, options);
    },

    post: function(uri, options) {
        L.Storage.Xhr._json('POST', uri, options);
    },

    submit_form: function(form_id, options) {
        if(typeof options === 'undefined') {
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
        if (!form) {
            return;
        }
        L.DomEvent
            .on(form, 'submit', L.DomEvent.stopPropagation)
            .on(form, 'submit', L.DomEvent.preventDefault)
            .on(form, 'submit', function () {
                L.Storage.Xhr.submit_form(form_id, options);
            });
    },

    listen_link: function (link_id, options) {
        var link = L.DomUtil.get(link_id);
        if (link) {
            L.DomEvent
                .on(link, 'click', L.DomEvent.stop)
                .on(link, 'click', function () {
                    if (options.confirm && !confirm(options.confirm)) { return;}
                    L.Storage.Xhr.get(link.href, options);
                });
        }
    },

    default_callback: function (data, options) {
        // default callback, to avoid boilerplate
        if (data.redirect) {
            var newPath = data.redirect;
            if (window.location.pathname == newPath) {
                window.location.reload();  // Keep the hash, so the current view
            }
            else {
                window.location = newPath;
            }
        }
        else if (data.info) {
            L.Storage.fire('ui:alert', {content: data.info, level: 'info'});
            L.Storage.fire('ui:end');
        }
        else if (data.error) {
            L.Storage.fire('ui:alert', {content: data.error, level: 'error'});
        }
        else if (data.html) {
            var ui_options = {'data': data},
                listen_options;
            if (options.cssClass) {
                ui_options.cssClass = options.cssClass;
            }
            L.Storage.fire('ui:start', ui_options);
            // To low boilerplate, if there is a form, listen it
            if (options.listen_form) {
                // Listen form again
                listen_options = L.Util.extend({}, options, options.listen_form.options);
                L.Storage.Xhr.listen_form(options.listen_form.id, listen_options);
            }
            if (options.listen_link) {
                for (var i=0, l=options.listen_link.length; i<l; i++) {
                    // Listen link again
                    listen_options = L.Util.extend({}, options, options.listen_link[i].options);
                    L.Storage.Xhr.listen_link(options.listen_link[i].id, listen_options);
                }
            }
        }
        else if (options.success) {
            // Success is called only if data contain no msg and no html
            options.success(data);
        }
    },

    login: function (data, args) {
        // data.html: login form
        // args: args of the first _json call, to call again at process end
        var self = this;
        var proceed = function () {
            L.Storage.fire('ui:end');
            if (typeof args !== 'undefined') {
                L.Storage.Xhr._json.apply(self, args);
            }
            else {
                self.default_callback(data, {});
            }
        };
        var ask_for_login = function (data) {
            L.Storage.fire('ui:start', {'data': data});
            L.Storage.Xhr.listen_form('login_form', {
                'callback': function (data) {
                    if (data.html) {
                        // Problem in the login
                        self.login(data, args);
                    }
                    else {
                        proceed();
                    }
                }
            });
            // Auth links
            var links = document.getElementsByClassName('storage-login-popup');
            Object.keys(links).forEach(function (el) {
                var link = links[el];
                L.DomEvent
                    .on(link, 'click', L.DomEvent.stopPropagation)
                    .on(link, 'click', L.DomEvent.preventDefault)
                    .on(link, 'click', function () {
                        L.Storage.fire('ui:end');
                        var win = window.open(link.href);
                        window.storage_proceed = function () {
                            proceed();
                            win.close();
                        };
                    });
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
    },

    buildQueryString: function (params) {
        var query_string = [];
        for (var key in params) {
            query_string.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
        return query_string.join('&');
    }

};
