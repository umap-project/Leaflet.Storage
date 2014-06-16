describe('L.Util', function () {

    describe('#toHTML()', function () {

        it('should handle bold', function () {
            assert.equal(L.Util.toHTML('Some **bold**'), 'Some <strong>bold</strong>');
        });

        it('should handle italic', function () {
            assert.equal(L.Util.toHTML('Some *italic*'), 'Some <em>italic</em>');
        });

        it('should handle links without formatting', function () {
            assert.equal(L.Util.toHTML('A simple http://osm.org link'), 'A simple <a target="_blank" href="http://osm.org">http://osm.org</a> link');
        });

        it('should handle simple link inside parenthesis', function () {
            assert.equal(L.Util.toHTML('A simple link (http://osm.org)'), 'A simple link (<a target="_blank" href="http://osm.org">http://osm.org</a>)');
        });

        it('should handle simple link with formatting', function () {
            assert.equal(L.Util.toHTML('A simple [[http://osm.org]] link'), 'A simple <a target="_blank" href="http://osm.org">http://osm.org</a> link');
        });

        it('should handle simple link with formatting and content', function () {
            assert.equal(L.Util.toHTML('A simple [[http://osm.org|link]]'), 'A simple <a target="_blank" href="http://osm.org">link</a>');
        });

        it('should handle simple link followed by a carriage return', function () {
            assert.equal(L.Util.toHTML('A simple link http://osm.org\nAnother line'), 'A simple link <a target="_blank" href="http://osm.org">http://osm.org</a><br>\nAnother line');
        });

        it('should handle image', function () {
            assert.equal(L.Util.toHTML('A simple image: {{http://osm.org/pouet.png}}'), 'A simple image: <img src="http://osm.org/pouet.png">');
        });

        it('should handle image with width', function () {
            assert.equal(L.Util.toHTML('A simple image: {{http://osm.org/pouet.png|100}}'), 'A simple image: <img src="http://osm.org/pouet.png" width="100">');
        });

        it('should handle iframe', function () {
            assert.equal(L.Util.toHTML('A simple iframe: {{{http://osm.org/pouet.html}}}'), 'A simple iframe: <iframe frameBorder="0" src="http://osm.org/pouet.html" width="100%" height="300px"></iframe>');
        });

        it('should handle iframe with height', function () {
            assert.equal(L.Util.toHTML('A simple iframe: {{{http://osm.org/pouet.html|200}}}'), 'A simple iframe: <iframe frameBorder="0" src="http://osm.org/pouet.html" width="100%" height="200px"></iframe>');
        });

    });

    describe('#escapeHTML', function () {

        it('should escape HTML tags', function () {
            assert.equal(L.Util.escapeHTML('<a href="pouet">'), '&lt;a href="pouet">');
        });

        it('should not fail with int value', function () {
            assert.equal(L.Util.escapeHTML(25), '25');
        });

        it('should not fail with null value', function () {
            assert.equal(L.Util.escapeHTML(null), '');
        });

    });

    describe('#TextColorFromBackgroundColor', function () {

        it('should output white for black', function () {
            document.body.style.backgroundColor = 'black';
            assert.equal(L.DomUtil.TextColorFromBackgroundColor(document.body), '#ffffff');
        });

        it('should output white for brown', function () {
            document.body.style.backgroundColor = 'brown';
            assert.equal(L.DomUtil.TextColorFromBackgroundColor(document.body), '#ffffff');
        });

        it('should output black for white', function () {
            document.body.style.backgroundColor = 'white';
            assert.equal(L.DomUtil.TextColorFromBackgroundColor(document.body), '#000000');
        });

        it('should output black for tan', function () {
            document.body.style.backgroundColor = 'tan';
            assert.equal(L.DomUtil.TextColorFromBackgroundColor(document.body), '#000000');
        });

        it('should output black by default', function () {
            document.body.style.backgroundColor = 'transparent';
            assert.equal(L.DomUtil.TextColorFromBackgroundColor(document.body), '#000000');
        });

    });

});
