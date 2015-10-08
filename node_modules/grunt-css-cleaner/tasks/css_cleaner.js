/*
 * grunt-css-cleaner
 * http://www.bitterbrown.com/grunt-css-cleaner
 *
 * Copyright (c) 2014 Paolo Moretti
 * Licensed under the MIT license.
 */

module.exports = function (grunt) { 'use strict';

  grunt.registerMultiTask('css_cleaner', 'Clean your unused css classes from your app', function () {

    var _this = this;

    // Utils
    Array.prototype.diff = function(a) {
      return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    Array.prototype.unique = function () {
      return this.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
    };

    Array.prototype.cleanClasses = function () {
      for(var i=0; i<this.length; i++) {
        this[i] = this[i].replace(" {", "");
      }
      return this;
    };

    Array.prototype.clean = function() {
      var cleaned = [];
      this.map(function (item) {
        var rules = [];
        item.rules.map(function (rule) {
          if(rule !== null)
            rules.push(rule);
        });
        if(rules.length > 0) {
          item.rules = rules;
          cleaned.push(item);
        }
      });
      return cleaned;
    };

    Array.prototype.printReport = function () {
      var s = "";
      this.map(function (item) {
        s += "\r\n\n=> " + item.file + "\r\n";
        s += item.rules.join("\r\n")
      });
      return s;
    };

    function notIgnored(rules) {
      var ret = [];
      rules.map(function (rule) {
        var pass = true;
        options.ignore.map(function (ignore) {
          if(rule.search(ignore) !== -1) {
            return pass = false;
          }
        });
        if (pass === true )
          ret.push(rule);
      });
      return ret;
    }

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      appRoot       : "./",
      writeReport   : false,
      templatesPath : ["./"],
      templatesType : ["html"],
      ignore        : []
    });

    var reportContent   = "";
    var styleRules      = [];
    var styleRulesObj   = [];

    // Find defined rules
    this.files.forEach(function (filePaths) {

      filePaths.src.forEach(function (filepath) {
        var content = grunt.file.read(filepath);

        var found = content.match(new RegExp(/(\.[\w-_\d]+)( {)/g));
        if (found != null) {
          styleRules = styleRules.concat (notIgnored(found.cleanClasses()));
          styleRulesObj.push({
            file: filepath,
            rules: notIgnored(found.cleanClasses())
          });
        }

      });
      styleRules = styleRules.unique();

      reportContent += "== "+_this.target+" ==";
      reportContent += "\n\rFound " + styleRules.length + " css rules";
      reportContent += "\n\r" + filePaths.src;

    });

    // Search code for usage
    var sources   = [];
    var rulesUsed = [];

    grunt.file.recurse(options.appRoot, function (abspath, rootdir, subdir, filename) {
      var fileExtension = filename.split(".")[filename.split(".").length - 1];

      options.templatesType.forEach( function (templateType) {
        if (fileExtension == templateType) {
          var content = grunt.file.read(abspath);

          styleRulesObj.forEach(function (conf, i) {
            conf.rules.forEach(function (rule, j) {
              if (rule !== null) {
                if (content.indexOf(rule.split(".")[1]) > -1) {
                  if (rulesUsed.indexOf(rule) == -1)
                    rulesUsed.push(rule);

                  styleRulesObj[i].rules[j] = null;
                }
              }
            });
          });

          styleRules.forEach(function (rule) {
            if (rule !== null) {
              if (content.indexOf(rule.split(".")[1]) > -1 && rulesUsed.indexOf(rule) == -1) {
                rulesUsed.push(rule);
              }
            }
          });
          sources.push(abspath);
        }
      });
    });

    styleRulesObj = styleRulesObj.clean();

    reportContent += "\r\n" + sources.length + " sources found";
    reportContent += "\r\n\n** JUNK CLASSES ("+styleRules.diff(rulesUsed).length+")\r" + styleRulesObj.printReport();
    reportContent += "\r\n\n** USED CLASSES ("+rulesUsed.length+")\r"; // + rulesUsed.join(",\r");

    console.log ("\r\nFound", styleRules.diff(rulesUsed).length, "potentially JUNK classes");

    if (options.writeReport !== false) {
      grunt.file.write(options.writeReport, reportContent);

      console.log ("\r\n+ Report created at", options.writeReport);
    }

  });

};
