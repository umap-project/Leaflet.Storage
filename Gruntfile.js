module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),


    copy: {
      main: {
        files: [
          {expand: true, cwd: 'node_modules/leaflet/dist/', src: ['**'], dest: 'reqs/leaflet/'},
          {expand: true, cwd: 'node_modules/leaflet-draw/dist/', src: ['**'], dest: 'reqs/draw/'},
          {expand: true, cwd: 'node_modules/leaflet-editable/src/', src: ['*.js'], dest: 'reqs/editable/'},
          {expand: true, cwd: 'node_modules/leaflet-hash/', src: ['*.js'], dest: 'reqs/hash/'},
          {expand: true, cwd: 'node_modules/leaflet-i18n/', src: ['*.js'], dest: 'reqs/i18n/'},
          {expand: true, cwd: 'node_modules/leaflet-editinosm/', src: ['*.js', '*.css'], dest: 'reqs/editinosm/'},
          {expand: true, cwd: 'node_modules/leaflet-minimap/src/', src: ['**'], dest: 'reqs/minimap/'},
          {expand: true, cwd: 'node_modules/leaflet-loading/src/', src: ['**'], dest: 'reqs/loading/'},
          {expand: true, cwd: 'node_modules/leaflet.markercluster/dist/', src: ['**'], dest: 'reqs/markercluster/'},
          {expand: true, cwd: 'node_modules/leaflet-measure/', src: ['*.js', '*.css'], dest: 'reqs/measure/'},
          {expand: true, cwd: 'node_modules/leaflet-contextmenu/dist/', src: ['**'], dest: 'reqs/contextmenu/'},
          {expand: true, cwd: 'node_modules/leaflet.label/dist/', src: ['**'], dest: 'reqs/label/'},
          {expand: true, cwd: 'node_modules/leaflet.heat/dist/', src: ['**'], dest: 'reqs/heat/'},
          {expand: true, cwd: 'node_modules/csv2geojson/', src: ['*.js'], dest: 'reqs/csv2geojson/'},
          {expand: true, cwd: 'node_modules/togeojson/', src: ['*.js'], dest: 'reqs/togeojson/'},
          {expand: true, cwd: 'node_modules/osmtogeojson/', src: ['osmtogeojson.js'], dest: 'reqs/osmtogeojson/'},
          {expand: true, cwd: 'node_modules/georsstogeojson/', src: ['GeoRSSToGeoJSON.js'], dest: 'reqs/georsstogeojson/'},
          {expand: true, cwd: 'node_modules/togpx/', src: ['togpx.js'], dest: 'reqs/togpx/'},
          {expand: true, cwd: 'node_modules/tokml/', src: ['tokml.js'], dest: 'reqs/tokml/'},
        ]
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['copy']);

};
