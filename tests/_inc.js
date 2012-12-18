// Paths must be relative to the Makefile dir (Leaflet.Storage root).
casper.startServer = function(port) {
    this.server = require('webserver').create();
    var fs = require("fs");
    var content = "";
    self = this;

    this.service = this.server.listen(port, function(request, response) {
        response.statusCode = 200;
        self.log("Server - handling URL " + request.url, "debug");

        if(request.url.indexOf('/src/') === 0 || request.url.indexOf('/reqs/') === 0){
            // serve statics
            content = fs.read('.' + request.url);
        }
        else if(request.url === '/'){
            // map detail page
            content = fs.read('./tests/index.html');
        }
        else {
            // mock ajax responses
            var path = request.url;
            path = path.replace(/^\/+|\/+$/g, ''); // trim /s
            path = path.replace(/\//g, '_'); // replace / by _
            path = './tests/responses/' + path + '.json';
            content = fs.read(path);
        }
        response.write(content);
        response.close();
    });
};

casper.toggleEditButton = function () {
    this.click('a.leaflet-control-edit-toggle');
};