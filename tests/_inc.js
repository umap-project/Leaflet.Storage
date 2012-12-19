// Paths must be relative to the Makefile dir (Leaflet.Storage root).
casper.startServer = function(port) {
    this.server = require('webserver').create();
    var fs = require("fs");
    var content = "";
    self = this;

    this.server.watchedPaths = {};

    this.server.watchPath = function(path, what) {
        this.watchedPaths[path] = what;
    };

    this.server.unwatchPath = function(path) {
        delete this.watchedPaths[path];
    };

    this.service = this.server.listen(port, function(request, response) {
        response.statusCode = 200;
        self.log("Server - handling URL " + request.url, "debug");

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