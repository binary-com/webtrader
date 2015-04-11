"use strict";

module.exports = function (grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-connect');
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
	grunt.loadNpmTasks('grunt-contrib-less');

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
                expand: true,
                cwd: 'dist/uncompressed',
                src: ['**/*.js'],
                dest: 'dist/compressed'
            }
        },
		'gh-pages': {
			'gh-pages-beta': {
				options: {
					base: 'dist/compressed',
					add: true,
					repo: 'https://' + process.env.GIT_KEY + '@github.com/regentmarkets/highcharts.git',
					message: 'Commiting v<%=pkg.version%> using TravisCI and GruntJS build process for beta'
				},
				src: ['**/*']
			},
            'gh-pages-prod': {
                options: {
                    base: 'dist/compressed',
                    add: true,
                    repo: 'https://' + process.env.GIT_KEY + '@github.com/regentmarkets/highcharts.git',
                    message: 'Commiting v<%=pkg.version%> using TravisCI and GruntJS build process for prod'
                },
                src: ['**/*']
            }
		},
		connect: {
			server: {
				options: {
					port: 10001,
					base: 'src',
					hostname: 'localhost',
					keepalive: true
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
        }
	});

	grunt.registerTask('default', ['jshint', 'clean:0', 'copy:main', 'clean:1', 'rename', 'replace', 'cssmin', 'htmlmin', 'uglify', 'copy:resourcesToCompressed']);

};
