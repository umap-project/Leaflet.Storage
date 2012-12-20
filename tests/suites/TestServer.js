casper.start('http://localhost:1337');

casper.urlToTitle = function (url) {
    this.evaluate(function (url) {
        L.Storage.Xhr.get(url, {
            callback: function (data) {
                var title = document.getElementsByTagName('title')[0];
                title.innerHTML = data.content;
            }
        });
    }, {url: url});
};

casper.sendPost = function (url, data) {
    this.evaluate(function(url, data) {
        __utils__.sendAJAX(url, 'POST', data, true);
    }, {url: url, data: data});
};

casper.then(function() {
    // Watch with an URL
    var url = "/test1234/";
    this.server.watchPath(url, function (path) {
        return JSON.stringify({content: 'test content 1234'});
    });
    this.urlToTitle(url);
});

casper.then(function() {
    this.test.assertTitle('test content 1234');
});

casper.then(function() {
    // Watch with a filename
    var url = "/test4321/";
    this.server.watchPath(url, "test");  // must use the responses/test.json file
    this.urlToTitle(url);
});

casper.then(function() {
    this.test.assertTitle('test content from file test.json');
});

casper.then(function() {
    // Default, must read the file responses/test_1_2_3.json
    var url = "/test/1/2/3/";
    this.urlToTitle(url);
});

casper.then(function() {
    this.test.assertTitle('test content from file test_1_2_3.json');
});

casper.then(function() {
    // Watch with a object
    var url = "/test9999/";
    this.server.watchPath(url, {statusCode: 200, data: '{"content": "content from object"}'});
    this.urlToTitle(url);
});

casper.then(function() {
    this.test.assertTitle('content from object');
});

casper.then(function () {
    path = '/testpostdata/';
    name_value = "this is a name";
    this.server.watchRequest(path);
    this.sendPost(path, {name: name_value});
});

casper.then(function () {
    var request = this.server.watchedRequests[path];
    this.test.assertTruthy(request, "Request has been catched");
    this.test.assertEqual(request.method, 'POST', 'POST received');
    this.test.assertEqual(request.post.name, name_value, 'POST name value is correct');
});

casper.run(function() {
    this.test.done();
});
