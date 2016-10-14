/* this file is called from extract.py file'*/
var esprima = require('./esprima.js')
var fs = require('fs');


var walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory())
          results = results.concat(walk(file));
        else
          (file.endsWith('.js')) && results.push(file)
    })
    return results;
}

var find = function(tree) {
  for (var key in tree) {
    if (!tree.hasOwnProperty(key)) continue;

    var prop = tree[key];
    if(!prop) continue;

    if (Array.isArray(prop))
      prop.forEach(find)
    else if(typeof prop === 'object') {
      if(prop.type == 'MemberExpression')
          if(prop.property.name == 'i18n' && prop.object.type == 'Literal')
              console.log(prop.object.value)
      find(prop);
    }
  }
}

var files = walk('../src');
files.forEach(function(file){
    var content = fs.readFileSync(file, 'utf8');
    var tree = esprima.parse(content);
    find(tree)
});
