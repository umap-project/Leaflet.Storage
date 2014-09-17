L.S.TableEditor = L.Class.extend({

    initialize: function (datalayer) {
        this.datalayer = datalayer;
        this.table = L.DomUtil.create('div', 'table');
        this.header = L.DomUtil.create('div', 'thead', this.table);
        this.body = L.DomUtil.create('div', 'tbody', this.table);
        this.resetProperties();
    },

    renderHeaders: function () {
        this.header.innerHTML = '';
        for (var i = 0; i < this.properties.length; i++) {
            this.renderHeader(this.properties[i]);
        }
    },

    renderHeader: function (property) {
        var container = L.DomUtil.create('div', 'tcell', this.header),
            title = L.DomUtil.add('span', '', container, property),
            del = L.DomUtil.create('i', 'storage-delete', container),
            rename = L.DomUtil.create('i', 'storage-edit', container);
        del.title = L._('Delete this property on all the features');
        rename.title = L._('Rename this property on all the features');
        var doDelete = function () {
            if (confirm(L._('Are you sure you want to delete this property on all the features?'))) {
                this.datalayer.eachLayer(function (feature) {
                    feature.deleteProperty(property);
                });
                this.resetProperties();
                this.edit();
            }
        };
        var doRename = function () {
            var newName = prompt(L._('Please enter the new name of this property'), property);
            if (!newName) return;
            this.datalayer.eachLayer(function (feature) {
                feature.renameProperty(property, newName);
            });
            this.resetProperties();
            this.edit();
        };
        L.DomEvent.on(del, 'click', doDelete, this);
        L.DomEvent.on(rename, 'click', doRename, this);
    },

    renderRow: function (feature) {
        var builder = new L.S.FormBuilder(feature, this.field_properties,
            {
                id: 'storage-feature-properties',
                className: 'trow',
                callback: feature.resetLabel
            }
        );
        this.body.appendChild(builder.build());
    },

    compileProperties: function () {
        var self = this,
            usable = function (feature, key) {
                return typeof feature.properties[key] !== 'object' && self.properties.indexOf(key) === -1;
            };
        this.datalayer.eachLayer(function (feature) {
            for (var key in feature.properties) {
                if (feature.properties.hasOwnProperty(key) && usable(feature, key)) {
                    this.properties.push(key);
                }
            }
        }, this);
        if (this.properties.length === 0) {
            this.properties = ['name'];
        }
        // description is a forced textarea, don't edit it in a text input, or you lose cariage returns
        if (this.properties.indexOf('description') !== -1) this.properties.splice(this.properties.indexOf('description'), 1);
        this.properties.sort();
        this.field_properties = [];
        for (var i = 0; i < this.properties.length; i++) {
            this.field_properties.push(['properties.' + this.properties[i], {wrapper: 'div', wrapperClass: 'tcell'}]);
        }
    },

    resetProperties: function () {
        this.properties = [];
    },

    edit: function () {
        var id = 'tableeditor:edit';
        this.datalayer.map.fire('dataloading', {id: id});
        this.compileProperties();
        this.renderHeaders();
        this.body.innerHTML = '';
        this.datalayer.eachLayer(this.renderRow, this);
        var addButton = L.DomUtil.create('li', '');
        L.DomUtil.create('i', 'storage-icon-16 storage-add', addButton);
        var label = L.DomUtil.create('span', '', addButton);
        label.innerHTML = label.title = L._('Add a new property');
        var addProperty = function () {
            var newName = prompt(L._('Please enter the name of the property'));
            if (!newName) return;
            this.properties = [newName];
            this.edit();
        };
        L.DomEvent.on(addButton, 'click', addProperty, this);
        var className = (this.properties.length > 2) ? 'storage-table-editor fullwidth' : 'storage-table-editor';
        L.S.fire('ui:start', {data: {html: this.table}, cssClass: className, actions: [addButton]});
        this.datalayer.map.fire('dataload', {id: id});
    }

});
