/*
 * grunt-css-cleaner
 * http://www.bitterbrown.com/grunt-css-cleaner
 *
 * Copyright (c) 2014 Paolo Moretti
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    css_cleaner: {
      custom_options: {
        options: {
          writeReport: "test/tmp/css-cleaner-report.txt"
        },
        files: {
          'tmp/scss': ['test/fixtures/**/*.*']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'css_cleaner', 'nodeunit']);

  // DEVELOPMENT
  grunt.registerTask('dev', ['css_cleaner']);

};
