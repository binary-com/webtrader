"use strict";
const sass = require('node-sass');

module.exports = function (grunt) {

    var pkg = grunt.file.readJSON("package.json");
    for (var key in pkg.devDependencies) {
        if (key.indexOf("grunt") !== -1) {
            grunt.loadNpmTasks(key);
        }
    }

    grunt.file.setBase('./');
    grunt.initConfig({
        pkg,
        githash: {
            main: {
                options: {},
            },
        },
        jshint: {
            options: {
                node: true
            },
            all: [
                // "src/**/*.js", "src/*.js" TODO
            ]
        },
        clean: {
            compressed: ["dist/compressed"],
            uncompressed: ["dist/uncompressed"],
            branches:[ "dist/branches"],
            current_branch: [ "dist/branches/compressed/<%= githash.main.branch %>"],
            dist: ["dist"],
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: "src/",
                        src: ["**", "!**/*.scss","!**/*.es6"],
                        dest: "dist/uncompressed/v<%=pkg.version%>"
                    }
                ]
            },
            copyLibraries: {
                files: [
                    {
                        expand: true,
                        cwd: "node_modules/",
                        src: [
                            "jquery-ui-iconfont/jquery-ui.icon-font.css",
                            "jquery-ui-iconfont/font/*",
                            "!binary-com-jquery-dialogextended/**", "binary-com-jquery-dialogextended/jquery.dialogextend.min.js",
                            "binary-com-jquery-ui-timepicker/jquery.ui.timepicker.js", "binary-com-jquery-ui-timepicker/jquery.ui.timepicker.css",
                            "binary-com-longcode/dist/main.js",
                            "@binary-com/binary-style/binary.css",
                            "@binary-com/binary-style/binary.js",
                            "@binary-com/binary-style/src/images/favicons/**",
                            "!highstock-release/**", "highstock-release/highstock.js", "highstock-release/themes/**", "highstock-release/modules/exporting.js", "highstock-release/modules/offline-exporting.js", "highstock-release/highcharts-more.js",
                            "moment/min/moment.min.js", "moment/locale/**",
                            "requirejs-text/text.js",
                            "@binary-com/webtrader-charts/dist/webtrader-charts.iife.js",
                            "regenerator-runtime/*",
                            "!jquery-ui-dist/**", "jquery-ui-dist/jquery-ui.min.css", "jquery-ui-dist/jquery-ui.min.js",
                            "chosen-js/*",
                            "jquery/dist/jquery.min.js",
                            "!vanderlee-colorpicker/**", "vanderlee-colorpicker/jquery.colorpicker.js", "vanderlee-colorpicker/images/**", "vanderlee-colorpicker/jquery.colorpicker.css",
                            "datatables.net-dt/images/**",
                            "datatables.net-dt/css/jquery.dataTables.css",
                            "datatables.net/js/jquery.dataTables.js",
                            "datatables.net-jqui/js/dataTables.jqueryui.js",
                            "datatables.net-jqui/css/dataTables.jqueryui.css",
                            "clipboard/dist/clipboard.min.js",
                            "es6-promise/promise.min.js",
                            "alameda/alameda.js",
                            "require-css/css.min.js",
                            "lodash/lodash.min.js",
                            "rivets/dist/rivets.min.js",
                            "sightglass/index.js",
                            "jquery-sparkline/jquery.sparkline.min.js",
                            "!jquery.growl/**", "jquery.growl/javascripts/jquery.growl.js", "jquery.growl/stylesheets/jquery.growl.css",
                            "npm-modernizr/modernizr.js",
                            "jquery-ui-touch-punch/jquery.ui.touch-punch.min.js"
                        ],
                        dest: "dist/uncompressed/v<%=pkg.version%>/lib/",
                    }
                ]
            },
            copy_AfterCompression: {
                files: [
                    {
                        expand: true,
                        cwd: "dist/uncompressed",
                        src: [
                            "**",
                            "!**/*.js", "**/lib/**/*.min.js", "**/lib/**/highstock.js", "**/lib/**/webtrader-charts.iife.js",
                            "!**/*.css", "!**/*.html","!**/*.{png,jpg,gif,svg}"
                        ],
                        dest: "dist/compressed"
                    }
                ]
            },
            /* copy the compressed folder to /dist/branches/compressed/CURRENT_GIT_BRANCH_NAME */
            copy_current_branch: {
                files: [
                    {
                        expand: true,
                        cwd: "dist/compressed",
                        src: [ "**"],
                        dest: "dist/branches/compressed/<%= githash.main.branch %>"
                    }
                ]
            },
            copy_i18n: {
                files: [
                    {
                        expand: true,
                        src: [ "**"],
                        cwd: "translations/i18n/json",
                        dest: "dist/uncompressed/v<%=pkg.version%>/i18n/"
                    }
                ]
            },
        },
        rename: {
            moveThis: {
                src: "dist/uncompressed/v<%=pkg.version%>/index.html",
                dest: "dist/uncompressed/index.html"
            }
        },
        replace: {
            version: {
                src: ["dist/uncompressed/index.html", "dist/uncompressed/manifest.webapp", "dist/uncompressed/manifest.json", "dist/uncompressed/auto-update.xml"],
                overwrite: true,
                replacements: [{
                    from: "<version>",
                    to: "<%=pkg.version%>"
                }, {
                    from: "<package-name>",
                    to: "<%=pkg.name.replace(/_/g, \" \")%>"
                }, {
                    from: "<description>",
                    to: "<%=pkg.description%>"
                }]
            },
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: "dist/uncompressed",
                src: ["**/*.css"],
                dest: "dist/compressed"
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            minify: {
                expand: true,
                cwd: "dist/uncompressed",
                src: ["**/*.html"],
                dest: "dist/compressed"
            }
        },
        imagemin: {
          dynamic: {
            files: [{
              expand: true,
              cwd: "dist/uncompressed/",
              src: ["**/*.{png,jpg,gif,svg}"],
              dest: "dist/compressed/"
            }]
          }
        },
        uglify: {
            minify: {
                files: [{
                    expand: true,
                    cwd: "dist/uncompressed",
                    src: ["**/*.js", "!**/lib/**/*.min.js", "!**/lib/**/highstock.js", "!**/lib/**/webtrader-charts.iife.js"],
                    dest: "dist/compressed"
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
        "gh-pages": {
            "travis-deploy":{
                options: {
                    base: "dist/compressed",
                    add: true,
                    repo: "https://" + process.env.MY_SECRET_ENV + "@github.com/binary-com/webtrader.git",
                    message: "Commit v<%=pkg.version%> from TravisCI for [" + process.env.TRAVIS_BRANCH + "]"
                },
                src: ["**/*"]
            },
            "deploy-branch": {
                options: {
                    base: "dist/branches/compressed",
                    add: true,
                    message: "Grunt deploy-branch v<%=pkg.version%> to $username.github.io/webtrader/<%= githash.main.branch %>"
                },
                src: ["**/*"]
            },
            "clean": {
                options: {
                    add: false /* remove existing files in gh-pages branch */,
                    message: "Cleaning all files in gh-pages"
                },
                src: [ "README.md"]
            }
        },
        connect: {
            server_uncompressed: {
                options: {
                    port: 9001,
                    base: "dist/uncompressed",
                    hostname: "0.0.0.0",
                    keepalive: true,
                    livereload: true
                }
            },
            server_compressed: {
                options: {
                    port: 9001,
                    base: "dist/compressed",
                    hostname: "0.0.0.0",
                    keepalive: true,
                    livereload: true
                }
            },
            https: {
                options: {
                    port: 443,
                    protocol: "https",
                    base: "dist/uncompressed",
                    hostname: "0.0.0.0",
                    keepalive: true,
                    livereload: true
                }
            }
        },
        bump: {
            options: {
                files: ["package.json"],
                updateConfigs: [],
                commit: false,
                /*commitMessage: "Release v%VERSION%",
                commitFiles: ["package.json"],*/
                createTag: false,
                /*tagName: "v%VERSION%",
                tagMessage: "Version %VERSION%",*/
                push: false,
                /*pushTo: "upstream",
                gitDescribeOptions: "--tags --always --abbrev=1 --dirty=-d",
                globalReplace: false,
                prereleaseName: false,*/
                regExp: false
            }
        },
        removelogging: {
            dist: {
                src : ["dist/compressed/**/*.js", "!dist/compressed/**/lib/**/*.js"],
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
              key: grunt.file.read("grunt/livereload.key"),
              cert: grunt.file.read("grunt/livereload.crt")
            }
          },
          scss: {
            options: { livereload: false },
            files: ["src/**/*.scss"],
            tasks: ["newer:sass"],
          },
          es6: {
            options: { livereload: false },
            files: ["src/**/*.es6"],
            tasks: ["newer:babel"],
          },
          index: {
              options: { livereload: false },
              files: ["src/index.html"],
              tasks: ["newer:copy:main", "rename", "replace"]
          },
          dist: {
            files: ["dist/uncompressed/v<%=pkg.version%>/**/*.*","!dist/uncompressed/v<%=pkg.version%>/index.html", "dist/uncompressed/index.html"],
            tasks: []
          },
          scripts: {
            options: { livereload: false },
            files: ["src/**","!src/index.html", "!src/**/*.scss", "!src/**/*.es6"],
            tasks: [ "newer:copy:main", "newer:copy:copy_i18n"],
          },
        },
        shell: {
            moveEverythingToBETA_folder: {
                command: "mkdir beta; mv dist/compressed/* beta; mv beta dist/compressed"
            }
        },
        po2json: {
          options: {
            format: "raw"
          },
          all: {
            src: ["translations/i18n/*.po"],
            dest: "translations/i18n/json/"
          }
        },
        sass: {
            options: {
                implementation: sass
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: "src/",
                        src: ["**/*.scss"],
                        dest: "dist/uncompressed/v<%=pkg.version%>",
                        ext: ".css"
                    }
                ]
            }
        },
        babel: {
          options: {
            sourceMap: true,
            presets: ['env', 'stage-0'],
            "plugins": [
              "transform-es2015-modules-amd",
              ["transform-runtime", {
                "helpers": false,
                "polyfill": false,
                "regenerator": true,
                "moduleName": "babel-runtime"
              }]
            ]
          },
          dist: {
            files: [
              {
                expand: true,
                cwd: "src/",
                src: ["**/*.es6"],
                dest: "dist/uncompressed/v<%=pkg.version%>",
                ext: ".js"
              }
            ]
          }
        },
    });

    grunt.registerTask("mainTask", ["clean:compressed","clean:uncompressed", "copy:main", "sass", "babel", "copy:copy_i18n", "copy:copyLibraries", "rename", "replace:version"]);
    grunt.registerTask("compressionAndUglify", ["cssmin", "htmlmin", "imagemin", "uglify", "copy:copy_AfterCompression"]);
    grunt.registerTask("default", ["jshint", "po2json", "mainTask", "compressionAndUglify", "removelogging"]);

    //Meant for local development use ONLY - for pushing to individual forks
    /* Deploy to a sub-folder of gh-pages with the name of current branch,
       This is only for developers working on different branches in their forks. */
    grunt.registerTask("deploy-branch", ["default","githash", "clean:current_branch", "copy:copy_current_branch", "gh-pages:deploy-branch"]);
    /* clean all the files in gh-pages branch */
    grunt.registerTask("gh-pages-clean", ["gh-pages:clean"]);

    // conditional switch for deployment
    grunt.registerTask("deploy", function () {
        if (process.env.TRAVIS_BRANCH === "master") {
            grunt.task.run(["gh-pages:travis-deploy"]);
        } else if (process.env.TRAVIS_BRANCH === "development") {
            grunt.task.run(["shell:moveEverythingToBETA_folder", "gh-pages:travis-deploy"]);
        }
    });
};
