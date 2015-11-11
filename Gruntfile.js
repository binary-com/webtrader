"use strict";

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-rename');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    /*
        "loc": 72,    //physical lines
        "sloc": 45,   //lines of source code
        "cloc": 10,   //total comment
        "scloc": 10,  //singleline
        "mcloc": 0,   //multiline
        "nloc": 17,   //multiline
        "file": 22,   //empty
    */
    grunt.loadNpmTasks('grunt-sloc');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks("grunt-remove-logging");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-if');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-gitinfo');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
            dist: ['dist']
        },
        copy: {
            main: {
                files: [
                    {
                        expand: true, 
                        cwd: 'src/', 
                        src: ['**'], 
                        dest: 'dist/uncompressed/v<%=pkg.version%>'
                    }
                ]
            },
            copyLibraries: {
                files: [
                    {
                        expand: true, 
                        cwd: 'bower_components/', 
                        src: [
                            '!binary-com-jquery-dialogextended/**', 'binary-com-jquery-dialogextended/jquery.dialogextend.min.js',
                            '!colorpicker/**', 'colorpicker/jquery.colorpicker.js', 'colorpicker/images/**', 'colorpicker/jquery.colorpicker.css',
                            '!datatables/**', 'datatables/media/images/**', 'datatables/media/js/jquery.dataTables.min.js', 'datatables/media/js/dataTables.jqueryui.min.js', 'datatables/media/css/jquery.dataTables.min.css', 'datatables/media/css/dataTables.jqueryui.min.css', 
                            '!growl/**', 'growl/javascripts/jquery.growl.js', 'growl/stylesheets/jquery.growl.css', 
                            '!jquery-ui/**', 'jquery-ui/themes/smoothness/images/**', 'jquery-ui/jquery-ui.min.js', 'jquery-ui/themes/smoothness/jquery-ui.min.css',
                            '!highstock/**', 'highstock/highstock.js', 'highstock/themes/sand-signika.js', 'highstock/modules/exporting.js',
                            'jquery/dist/jquery.min.js',
                            'jquery.timers/jquery.timers.min.js',
                            'jquery-validation/dist/jquery.validate.min.js',
                            'lokijs/build/lokijs.min.js',
                            'modernizr/modernizr.js',
                            'reconnectingWebsocket/reconnecting-websocket.min.js',
                            'es6-promise/promise.min.js',
                            'requirejs/require.js',
                            'js-cookie/src/js.cookie.js',
                            'require-css/css.min.js',
                            'text/text.js',
                            'underscore/underscore-min.js',
                            '!**/**/favicon.ico'
                        ], 
                        dest: 'dist/uncompressed/v<%=pkg.version%>/lib'
                    }
                ]
            },
            copy_AfterCompression: {
                files: [
                    {
                        expand: true, 
                        cwd: 'dist/uncompressed',
                        src: [
                            '**', '!**/*.js', '!**/*.css', '!**/*.html'
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
            }
        },
        rename: {
            moveThis: {
                src: 'dist/uncompressed/v<%=pkg.version%>/index.html',
                dest: 'dist/uncompressed/index.html'
            }
        },
        replace: {
            version: {
                src: ['dist/uncompressed/index.html'],
                overwrite: true,
                replacements: [{
                    from: '<verrsion>', //TODO, not working
                    to: 'v<%=pkg.version%>'
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
                src: ['**/*.html'],
                dest: 'dist/compressed'
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
          scripts: {
            files: ['src/**'],
            tasks: ['mainTask'],
            options: {
              spawn: false,
              interrupt : true,
              livereload: true
            },
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
        }
    });

    grunt.registerTask('mainTask', ['clean:compressed','clean:uncompressed', 'copy:main', 'copy:copyLibraries', 'rename', 'replace']);
    grunt.registerTask('compressionAndUglify', ['cssmin', 'htmlmin', 'uglify', 'copy:copy_AfterCompression']);
	grunt.registerTask('default', ['jshint', 'mainTask', 'compressionAndUglify', 'removelogging']);

    //Meant for local development use ONLY - for pushing to individual forks
    /* Note: between "grunt deploy" and "grunt deploy-branch" only use one of them. */
    grunt.registerTask('deploy', ['default', 'gh-pages:deploy']);
    /* Deoploy to a subfolder of gh-pages with the name of current branch,
       This is only for developers working on different branches in their forks. */
    grunt.registerTask('deploy-branch', ['default','gitinfo', 'clean:current_branch', 'copy:copy_current_branch', 'gh-pages:deploy-branch']);
   
};
