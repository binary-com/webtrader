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
    grunt.loadNpmTasks('grunt-css-cleaner');

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
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks("grunt-remove-logging");

    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                node: true
            },
            all: [
                'Gruntfile.js'//, 'src/**/*.js', 'src/*.js' TODO
            ]
        },
        clean: ['dist', 'dist/**/TODO'],
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/', src: ['**'], dest: 'dist/uncompressed/v<%=pkg.version%>'}
                ]
            },
            resourcesToCompressed: {
              files: [
                  {expand: true, cwd: 'dist/uncompressed', src: ['**', '!**/*.css', '!**/*.js', '!**/*.html'], dest: 'dist/compressed'}
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
                    from: 'v1.0.0', //TODO, not working
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
                    src: '**/*.js',
                    dest: 'dist/compressed'
                }],
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
                files: ['package.json'],
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
        css_cleaner: {
            taskname: {
                options: {
                    appRoot : "./dist/compressed"
                }
            }
        },
        removelogging: {
            dist: {
                src : "dist/compressed/**/*.js",
				verbose : false
            }
        },
        watch: {
          options: { livereload: true },
          scripts: {
            files: ['src/**'],
            tasks: ['clean:0', 'copy:main', 'clean:1', 'rename', 'replace', 'copy:resourcesToCompressed'],
            options: {
              spawn: true,
            },
          },
        }
    });

	grunt.registerTask('default', ['jshint', 'clean:0', 'copy:main', 'clean:1', 'rename', 'replace', 'cssmin', 'htmlmin', 'uglify', 'copy:resourcesToCompressed', 'css_cleaner', 'removelogging']);
    grunt.registerTask('deploy', ['default', 'gh-pages:deploy']);

};
