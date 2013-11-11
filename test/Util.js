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

        it('should handle simple link with formatting', function () {
            assert.equal(L.Util.toHTML('A simple [[http://osm.org]] link'), 'A simple <a target="_blank" href="http://osm.org">http://osm.org</a> link');
        });

        it('should handle simple link with formatting and content', function () {
            assert.equal(L.Util.toHTML('A simple [[http://osm.org|link]]'), 'A simple <a target="_blank" href="http://osm.org">link</a>');
        });

    });

});