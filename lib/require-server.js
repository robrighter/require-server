var fs = require('fs');
var codehash = {};

module.exports = function(filetoload){
  var toreturn = '';
  files = findScriptDirAndInitialFileName(filetoload);
  scriptdir = files.scriptdir;
  codehash.main = processDep(files.initialmodule);
  toreturn = processOutput(codehash);
  codehash = {};
  return toreturn;
}

function findScriptDirAndInitialFileName(filetoload){
  //TODO finish this up
  return {
    scriptdir: './scripts',
    initialmodule: 'main'
  }
}

function define(deps, callback){
  deps.forEach(function(item){
    if(!codehash.hasOwnProperty(item)){
      //we have not yet added this dep to the hash so add it
      codehash[item] = processDep(item);
    }
  });

  return {
    deps: deps,
    code: callback
  };
}

function processDep(name){
  var contents = fs.readFileSync(scriptdir+'/'+name+'.js');
  var dep;
  console.log("Processing file %s", name);
  eval('dep = ' + contents);
  return dep;
}

function stringifyCodeHash(codehash){
  return "{\n" +
  Object.keys(codehash).map(function(item){
    return '"'+item+'": { deps: '+ makeDepString(codehash[item].deps) +', code: '+makeCodeString(codehash[item].code)+' }';
  }).join(",\n") +
  "\n}";
}

function makeDepString(deps){
  var list = deps.map(function(d){return "'"+d+"'"}).join(',');
  return '['+ list + ']';
}

function makeCodeString(code){
  return String(code);
}

function map(arr, callback){
  var toreturn = [];
  var i;
  for(i=0;i<arr.length;i++){
    toreturn[i] = callback(arr[i]);
  }
  return toreturn;
}

function runModule(name){
  var code = codehash[name].code;
  var deps = codehash[name].deps;
  return code.apply({}, map(deps,runModule));
}

function processOutput(codehash){
  return "(function(){"+
    "\nvar codehash=" +
    stringifyCodeHash(codehash) + ";\n" +
    map + "\n" + 
    runModule + "\n" +
    "\nrunModule('main');\n" +
    "})();";
}
