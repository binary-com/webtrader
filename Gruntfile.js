"use strict";

module.exports = function (grunt) {
	
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-rename');
	grunt.loadNpmTasks('grunt-text-replace');

	grunt.loadNpmTasks('grunt-gh-pages');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');

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
					{expand: true, cwd: 'src/', src: ['**'], dest: 'dist/v<%=pkg.version%>'}
				]
			}
		},
		rename: {
			moveThis: {
				src: 'dist/v<%=pkg.version%>/index.html',
				dest: 'dist/index.html'
			}
		},
		replace: {
			example: {
				src: ['dist/index.html'],
				overwrite: true,
				replacements: [{
					from: 'v1.0.0', //TODO, not working
					to: 'v<%=pkg.version%>'
				}]
			}
		},
		'gh-pages': {
			'gh-pages': {
				options: {
					base: 'dist/',
					add: true,
					repo: 'https://' + process.env.GIT_KEY + '@github.com/regentmarkets/highcharts.git',
					message: 'Commiting v<%=pkg.version%> using TravisCI and GruntJS build process'
				},
				src: ['**/*']
			}
		},
		connect: {
			server: {
				options: {
					port: 10001,
					base: 'src',
					hostname: '192.168.1.155',
					keepalive: true
				}
			}
		}
	});

	grunt.registerTask('default', ['jshint', 'clean:0', 'copy', 'clean:1', 'rename', 'replace']);

};
