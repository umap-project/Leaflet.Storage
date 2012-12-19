// Paths must be relative to the Makefile dir (Leaflet.Storage root).
casper.startServer = function(port) {
    this.server = require('webserver').create();
    var fs = require("fs");
    var content = "";
    self = this;

    this.server.watchedPaths = {};
    this.server.watchedRequests = {};

    this.server.watchPath = function(path, what) {
        this.watchedPaths[path] = what;
    };

    this.server.unwatchPath = function(path) {
        delete this.watchedPaths[path];
    };

    this.server.watchRequest = function(path) {
        // Watch a response to be able to test it's value after process
        this.watchedRequests[path] = null;
    };

    this.server.unwatchRequest = function(path) {
        delete this.watchedRequests[path];
    };

    this.service = this.server.listen(port, function(request, response) {
        response.statusCode = 200;
        self.log("Server - handling URL " + request.url, "debug");

        if (typeof self.server.watchedRequests[request.url] !== "undefined") {
            // EXPERIMENTAL!
            // replace the un parsed post string with a readable key/value
            // Example of raw post:
            // "------WebKitFormBoundarysxecJyeWZZikD2xz\r\nContent-Disposition: form-data; name=\"name\"\r\n\r\nBirds map\r\n------WebKitFormBoundarysxecJyeWZZikD2xz\r\nContent-Disposition: form-data; name=\"description\"\r\n\r\nWhere have you seen birds?\r\n------WebKitFormBoundarysxecJyeWZZikD2xz\r\nContent-Disposition: form-data; name=\"licence\"\r\n\r\n1\r\n------WebKitFormBoundarysxecJyeWZZikD2xz\r\nContent-Disposition: form-data; name=\"center\"\r\n\r\nPOINT (15.9191894531249982 49.0018439179785261)\r\n------WebKitFormBoundarysxecJyeWZZikD2xz--\r\n"
            var post = {},
                rawPost = request.post.trim(),
                boundary = "--" + request.headers['Content-Type'].split('boundary=')[1],
                els = rawPost.split(boundary),
                subels, name, value;
            for (var i = 1, l = els.length; i < l; i++) {
                if (!els[i] || els[i] == "--") {
                    continue;
                }
                subels = els[i].split('\r\n');
                value = subels[3];
                name = subels[1].match(/name="(\S+)"/i)[1];
                post[name] = value;
            }
            request.post = post;
            self.server.watchedRequests[request.url] = request;
        }

        if(request.url.search('^(/src/|/reqs/|/contrib/)') !== -1){
            // serve statics
            content = fs.read('.' + request.url);
        }
        else if(request.url === '/'){
            // map detail page
            content = fs.read('./tests/index.html');
        }
        else if (typeof self.server.watchedPaths[request.url] !== "undefined") {
            var what = self.server.watchedPaths[request.url];
            // what can be a function, an object with response properties or a filepath (string)
            if (typeof what == "function") {
                content = what(request.url);
            }
            else if (typeof what == "string") {
                content = fs.read('./tests/responses/' + what + '.json');
            }
            else {
                if (what.statusCode) {
                    response.statusCode = what.statusCode;
                }
                if (what.data) {
                    content = what.data;
                }
            }
        }
        else {
            // mock ajax responses
            var path = request.url;
            path = path.replace(/^\/+|\/+$/g, ''); // trim /s
            path = path.replace(/\//g, '_'); // replace / by _
            path = './tests/responses/' + path + '.json';
            if (fs.exists(path)) {
                content = fs.read(path);
            }
            else {
                response.statusCode = 404;
                content = "Not Found";
            }
        }
        response.write(content);
        response.close();
    });
};

casper.toggleEditButton = function () {
    this.click('a.leaflet-control-edit-toggle');
};