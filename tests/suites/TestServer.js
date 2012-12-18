casper.start('http://localhost:1337');

casper.urlToTitle = function (url) {
    this.evaluate(function (url) {
        console.log('init of evaluate');
        L.Storage.Xhr.get(url, {
            callback: function (data) {
                console.log('init of callback', data.content);
                var title = document.getElementsByTagName('title')[0];
                title.innerHTML = data.content;
                console.log(title.innerHTML);
            }
        });
    }, {url: url});
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

casper.run(function() {
    this.test.done();
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
