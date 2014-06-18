L.S.Slideshow = L.Class.extend({

    statics: {
        CLASSNAME: 'storage-slideshow-active'
    },

    options: {
        delay: 5000,
        autorun: false
    },

    initialize: function (map, options) {
        L.setOptions(this, options);
        this.map = map;
        this._id = null;
        var current = null;  // current feature
        try {
            Object.defineProperty(this, 'current', {
                get: function () {
                    if (!current) {
                        var datalayer = map.defaultDataLayer();
                        current = datalayer.getFeatureByIndex(0);
                    }
                    return current;
                },
                set: function (feature) {
                    current = feature;
                }
            });
        }
        catch (e) {
            // Certainly IE8, which has a limited version of defineProperty
        }
        if  (this.options.autorun) {
            this.map.onceDatalayersLoaded(function () {
                this.play();
            }, this);
        }
        this.map.on('edit:enabled', function () {
            this.stop();
        }, this);
    },

    setOptions: function (options) {
        L.setOptions(this, options);
    },

    play: function () {
        if (this._id) return;
        if (this.map.editEnabled) return;
        if (!this.current) return;
        L.DomUtil.addClass(document.body, L.S.Slideshow.CLASSNAME);
        this._id = window.setInterval(L.bind(this.loop, this), this.options.delay);
        this.loop();
    },

    loop: function () {
        this.step();
        this.current = this.current.getNext();
    },

    pause: function () {
        if (this._id) {
            L.DomUtil.removeClass(document.body, L.S.Slideshow.CLASSNAME);
            window.clearInterval(this._id);
            this._id = null;
        }
    },

    stop: function () {
        this.pause();
        this.current = null;
    },

    forward: function () {
        this.pause();
        this.current = this.current.getNext();
        this.step();
    },

    backward: function () {
        this.pause();
        this.current = this.current.getPrevious();
        this.step();
    },

    step: function () {
        var view = function () {this.view(this.getCenter());};
        this.current.bringToCenter({zoomTo: this.current.getOption('zoomTo')}, L.bind(view, this.current));
    },

    renderToolbox: function () {
        var box = L.DomUtil.create('ul', 'storage-slideshow-toolbox'),
            prev = L.DomUtil.create('li', 'prev', box),
            play = L.DomUtil.create('li', 'play', box),
            stop = L.DomUtil.create('li', 'stop', box),
            next = L.DomUtil.create('li', 'next', box);
        play.title = L._('Start slideshow');
        stop.title = L._('Stop slideshow');
        next.title = L._('Zoom to the next');
        prev.title = L._('Zoom to the previous');
        var toggle = function () {
            if (this._id) this.pause();
            else this.play();
        };
        L.DomEvent.on(play, 'click', L.DomEvent.stop)
                  .on(play, 'click', toggle, this);
        L.DomEvent.on(stop, 'click', L.DomEvent.stop)
                  .on(stop, 'click', this.stop, this);
        L.DomEvent.on(prev, 'click', L.DomEvent.stop)
                  .on(prev, 'click', this.backward, this);
        L.DomEvent.on(next, 'click', L.DomEvent.stop)
                  .on(next, 'click', this.forward, this);
        return box;
    }

});
