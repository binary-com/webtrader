"use strict";

module.exports = function (grunt) {

    var pkg = grunt.file.readJSON('package.json');
    for (var key in pkg.devDependencies) {
        if (key.indexOf('grunt') !== -1) {
            grunt.loadNpmTasks(key);
        }
    }

    grunt.initConfig({
        pkg: pkg,
        //Executing this task will populate grunt.config.gitinfo with repository data below
        gitinfo: {
            local: { branch: { current: { SHA: "", name: "", currentUser: "", } } },
            remote: { origin: { url: "" } }
        },
        jshint: {
            options: {
                node: true
            },
            all: [
                'Gruntfile.js'//, 'src/**/*.js', 'src/*.js' TODO
            ]
        },
        clean: {
            compressed: ['dist/compressed'],
            uncompressed: ['dist/uncompressed'],
            branches:[ 'dist/branches'],
            current_branch: [ 'dist/branches/compressed/<%= gitinfo.local.branch.current.name %>'],
            dist: ['dist'],
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**', '!**/*.scss','!**/*.es6', '!charts/indicators/highcharts_custom/**', 'charts/indicators/highcharts_custom/currentprice.js'],
                        dest: 'dist/uncompressed/v<%=pkg.version%>'
                    }
                ]
            },
            copyLibraries: {
                files: [
                    {
                        expand: true,
                        cwd: 'node_modules/',
                        src: [
                            'jquery-ui-iconfont/jquery-ui.icon-font.css', 'jquery-ui-iconfont/font/*',
                        ],
                        dest: 'dist/uncompressed/v<%=pkg.version%>/lib/',
                    },
                    {
                        expand: true,
                        cwd: 'bower_components/',
                        src: [
                            '!binary-com-jquery-dialogextended/**', 'binary-com-jquery-dialogextended/jquery.dialogextend.min.js',
                            '!colorpicker/**', 'colorpicker/jquery.colorpicker.js', 'colorpicker/images/**', 'colorpicker/jquery.colorpicker.css',
                            '!datatables/**', 'datatables/media/images/**', 'datatables/media/js/jquery.dataTables.min.js', 'datatables/media/js/dataTables.jqueryui.min.js', 'datatables/media/css/jquery.dataTables.min.css', 'datatables/media/css/dataTables.jqueryui.min.css',
                            '!growl/**', 'growl/javascripts/jquery.growl.js', 'growl/stylesheets/jquery.growl.css',
                            '!jquery-ui/**', 'jquery-ui/themes/**', 'jquery-ui/jquery-ui.min.js',
                            '!highstock/**', 'highstock/highstock.js', 'highstock/themes/**', 'highstock/modules/exporting.js', 'highstock/modules/offline-exporting.js', 'highstock/highcharts-more.js',
                            'binary-com-jquery-ui-timepicker/jquery.ui.timepicker.js', 'binary-com-jquery-ui-timepicker/jquery.ui.timepicker.css',
                            'jquery/dist/jquery.min.js',
                            'jquery-validation/dist/jquery.validate.min.js',
                            'lokijs/build/lokijs.min.js',
                            'modernizr/modernizr.js',
                            'clipboard/dist/clipboard.min.js',
                            'reconnectingWebsocket/reconnecting-websocket.min.js',
                            'es6-promise/promise.min.js',
                            'requirejs/require.js',
                            'require-css/css.min.js',
                            'text/text.js',
                            'lodash/dist/lodash.min.js',
                            'underscore/underscore-min.js',
                            'rivets/dist/rivets.min.js',
                            'sightglass/index.js',
                            'jquery-sparkline/dist/jquery.sparkline.min.js',
                            'moment/min/moment.min.js',
                            'ddslick/jquery.ddslick.min.js',
                            '!**/**/favicon.ico',
                            'parallel.js/lib/**'
                        ],
                        dest: 'dist/uncompressed/v<%=pkg.version%>/lib/',
                        rename: function(dest, src) {
                          // grunt uglify complains about folders anding with .js
                          return dest + src.replace("parallel.js/", "parallel_js/");
                        }
                    }
                ]
            },
            copy_AfterCompression: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/uncompressed',
                        src: [
                            '**', '!**/*.js', '!**/*.css', '!**/*.html','!**/*.{png,jpg,gif,svg}', '**/404.html'
                        ],
                        dest: 'dist/compressed'
                    }
                ]
            },
            /* copy the compressed folder to /dist/branches/compressed/CURRENT_GIT_BRANCH_NAME */
            copy_current_branch: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/compressed',
                        src: [ '**'],
                        dest: 'dist/branches/compressed/<%= gitinfo.local.branch.current.name %>'
                    }
                ]
            },
            copy_i18n: {
                files: [
                    {
                        expand: true,
                        src: [ '**'],
                        cwd: 'translations/i18n/json',
                        dest: 'dist/uncompressed/v<%=pkg.version%>/i18n/'
                    }
                ]
            },
            copyChromeManifest: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        cwd: '.',
                        src: ["chrome_extension/*"],
                        dest: 'dist/uncompressed/'
                    }
                ]
            }
        },
        rename: {
            moveThis: {
                src: 'dist/uncompressed/v<%=pkg.version%>/index.html',
                dest: 'dist/uncompressed/index.html'
            },
            move404: {
                src: 'dist/uncompressed/v<%=pkg.version%>/404.html',
                dest: 'dist/uncompressed/404.html'
            }
        },
        replace: {
            version: {
                src: ['dist/uncompressed/index.html', 'dist/uncompressed/manifest.webapp', 'dist/uncompressed/manifest.json', 'dist/uncompressed/auto-update.xml', 'dist/uncompressed/404.html'],
                overwrite: true,
                replacements: [{
                    from: '<version>',
                    to: '<%=pkg.version%>'
                }, {
                    from: '<package-name>',
                    to: "<%=pkg.name.replace(/_/g, ' ')%>"
                }, {
                    from: '<description>',
                    to: "<%=pkg.description%>"
                }]
            }
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'dist/uncompressed',
                src: ['**/*.css'],
                dest: 'dist/compressed'
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            minify: {
                expand: true,
                cwd: 'dist/uncompressed',
                src: ['**/*.html','!**/404.html'],
                dest: 'dist/compressed'
            }
        },
        imagemin: {
          static: {
            options: {
              optimizationLevel: 3,
              svgoPlugins: [{ removeViewBox: false }],
              use: []
            }
          },
          dynamic: {
            files: [{
              expand: true,
              cwd: 'dist/uncompressed/',
              src: ['**/*.{png,jpg,gif,svg}'],
              dest: 'dist/compressed/'
            }]
          }
        },
        uglify: {
            minify: {
                files: [{
                    expand: true,
                    cwd: 'dist/uncompressed',
                    src: ['**/*.js'],
                    dest: 'dist/compressed'
                }],
                options: {
                    mangle: true,
                    compress: {
                        sequences: true,
                        dead_code: true,
                        conditionals: true,
                        booleans: true,
                        unused: true,
                        if_return: true,
                        join_vars: true,
                        drop_console: true
                    }
                }
            }
        },
        'gh-pages': {
            'travis-deploy':{
                options: {
                    base: 'dist/compressed',
                    add: true,
                    repo: 'https://' + process.env.GIT_KEY + '@github.com/binary-com/webtrader.git',
                    message: 'Commiting v<%=pkg.version%> using TravisCI and GruntJS build process'
                },
                src: ['**/*']
            },
            'deploy': {
                options: {
                    base: 'dist/compressed',
                    add: true,
                    message: 'Commiting v<%=pkg.version%> using GruntJS build process for prod'
                },
                src: ['**/*']
            },
            'deploy-branch': {
                options: {
                    base: 'dist/branches/compressed',
                    add: true,
                    message: 'Grunt deploy-branch v<%=pkg.version%> to $username.github.io/webtrader/<%= gitinfo.local.branch.current.name %>'
                },
                src: ['**/*']
            },
            'clean': {
                options: {
                    add: false /* remove existing files in gh-pages branch */,
                    message: 'Cleaning all files in gh-pages'
                },
                src: [ 'README.md']
            }
        },
        connect: {
            server_uncompressed: {
                options: {
                    port: 9001,
                    base: 'dist/uncompressed',
                    hostname: '0.0.0.0',
                    keepalive: true,
                    livereload: true
                }
            },
            server_compressed: {
                options: {
                    port: 9001,
                    base: 'dist/compressed',
                    hostname: '0.0.0.0',
                    keepalive: true,
                    livereload: true
                }
            },
            https: {
                options: {
                    port: 443,
                    protocol: 'https',
                    base: 'dist/uncompressed',
                    hostname: '0.0.0.0',
                    keepalive: true,
                    livereload: true
                }
            }
        },
        sloc: {
            analyze: {
                files: {
                    //Check the negate option. Its not working
                    //Currently open ticket https://github.com/rhiokim/grunt-sloc/issues/14
                    //TODO
                    src: ['**/*.js', '**/*.css', '**/*.html', '!**/libs/**']
                }
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: [],
                commit: false,
                /*commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],*/
                createTag: false,
                /*tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',*/
                push: false,
                /*pushTo: 'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,*/
                regExp: false
            }
        },
        removelogging: {
            dist: {
                src : ["dist/compressed/**/*.js"],
				options : {
					"verbose" : false
				}
            }
        },
        watch: {
          options: {
            spawn: true,
            interrupt : false,
            livereload: {
              key: grunt.file.read('grunt/livereload.key'),
              cert: grunt.file.read('grunt/livereload.crt')
            }
          },
          scss: {
            options: { livereload: false },
            files: ['src/**/*.scss'],
            tasks: ['newer:sass'],
          },
          es6: {
            options: { livereload: false },
            files: ['src/**/*.es6'],
            tasks: ['newer:babel'],
          },
          index: {
              options: { livereload: false },
              files: ['src/index.html'],
              tasks: ['newer:copy:main', 'rename', 'replace']
          },
          dist: {
            files: ['dist/uncompressed/v<%=pkg.version%>/**/*.*','!dist/uncompressed/v<%=pkg.version%>/index.html', 'dist/uncompressed/index.html'],
            tasks: []
          },
          scripts: {
            options: { livereload: false },
            files: ['src/**','!src/index.html', '!src/**/*.scss', '!src/**/*.es6'],
            tasks: [ 'newer:copy:main', 'newer:copy:copy_i18n', 'newer:concat:concat_indicators', 'newer:copy:copyChromeManifest'],
          },
        },
        shell: {
            moveEverythingToBETA_folder: {
                command: 'mkdir beta; mv dist/compressed/* beta; mv beta dist/compressed'
            }
        },
        if: {
            live: {
                // Target-specific file lists and/or options go here.
                options: {
                    // execute test function(s)
                    test: function() {
                        return process.env.TRAVIS_BRANCH === 'master';
                    }
                },
                //array of tasks to execute if all tests pass
                ifTrue: [ 'gh-pages:travis-deploy' ]
            },
            beta: {
                // Target-specific file lists and/or options go here.
                options: {
                    // execute test function(s)
                    test: function() {
                        return process.env.TRAVIS_BRANCH === 'development';
                    }
                },
                //array of tasks to execute if all tests pass
                ifTrue: [ 'shell:moveEverythingToBETA_folder', 'gh-pages:travis-deploy' ]
            }
        },
        concat: {
            concat_indicators: {
                //Define the sequence here, indicators which require other indicators to be built first, should be explicitly listed here
                src: ['src/charts/indicators/highcharts_custom/IndicatorBase.js',
                        'src/charts/indicators/highcharts_custom/WMA.js',
                        'src/charts/indicators/highcharts_custom/SMA.js',
                        'src/charts/indicators/highcharts_custom/EMA.js',
                        'src/charts/indicators/highcharts_custom/TEMA.js',
                        'src/charts/indicators/highcharts_custom/TRIMA.js',
                        'src/charts/indicators/highcharts_custom/STDDEV.js',
                        'src/charts/indicators/highcharts_custom/**/*.js',
                        '!src/charts/indicators/highcharts_custom/currentprice.js'
                    ],
                dest: 'dist/uncompressed/v<%=pkg.version%>/charts/indicators/highcharts_custom/indicators.js'
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'dist/uncompressed/chrome_extension.zip'
                },
                files:
                    [
                        {
                            expand: true,
                            cwd: 'dist/uncompressed/',
                            src: ['auto-update.xml', 'manifest.json', 'chrome_background.js',
                                'v<%=pkg.version%>/images/favicons/**']
                        }
                    ]
            }
        },
        po2json: {
          options: {
            format: 'raw'
          },
          all: {
            src: ['translations/i18n/*.po'],
            dest: 'translations/i18n/json/'
          }
        },
        sass: {
          // options: { sourceMap: true },
          dist: {
            files: [
              {
                expand: true,
                cwd: 'src/',
                src: ['**/*.scss'],
                dest: 'dist/uncompressed/v<%=pkg.version%>',
                ext: '.css'
              }
            ]
          }
        },
        babel: {
          options: {
            sourceMap: true,
            presets: ['es2015', 'stage-0']
          },
          dist: {
            files: [
              {
                expand: true,
                cwd: 'src/',
                src: ['**/*.es6'],
                dest: 'dist/uncompressed/v<%=pkg.version%>',
                ext: '.js'
              }
            ]
          }
        }
    });

    grunt.registerTask('mainTask', ['clean:compressed','clean:uncompressed', 'copy:main', 'sass', 'babel', 'copy:copy_i18n', 'concat:concat_indicators', 'copy:copyLibraries', 'copy:copyChromeManifest', 'rename', 'replace']);
    grunt.registerTask('compressionAndUglify', ['cssmin', 'htmlmin', 'imagemin', 'uglify', 'compress', 'copy:copy_AfterCompression']);
  	grunt.registerTask('default', ['jshint', 'po2json', 'mainTask', 'compressionAndUglify', 'removelogging']);

    //Meant for local development use ONLY - for pushing to individual forks
    /* Note: between "grunt deploy" and "grunt deploy-branch" only use one of them. */
    grunt.registerTask('deploy', ['default', 'gh-pages:deploy']);
    /* Deoploy to a subfolder of gh-pages with the name of current branch,
       This is only for developers working on different branches in their forks. */
    grunt.registerTask('deploy-branch', ['default','gitinfo', 'clean:current_branch', 'copy:copy_current_branch', 'gh-pages:deploy-branch']);
    /* clean all the files in gh-pages branch */
    grunt.registerTask('gh-pages-clean', ['gh-pages:clean']);
};
