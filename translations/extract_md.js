var fs = require('fs');
var showdown = require('showdown'),
    converter = new showdown.Converter();

var walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory())
          results = results.concat(walk(file));
        else
          (file.endsWith('.md')) && results.push(file)
    })
    return results;
}

var files = walk('../src');

files.forEach(function(file){
    var content = fs.readFileSync(file, 'utf8');
    var html = converter.makeHtml(content);
    console.log(html);
});
