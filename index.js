var fs = require('fs'),
    yamljs = require('yamljs'),
    changeCase = require('change-case'),
    async = require('async'),
    path = require('path');
    _ = require('underscore'),
    Q = require('q');

function mergeConfigs(conf1, conf2) {
	// prefer left config
	var result = conf2;
	Object.keys(conf1).forEach(function(key) {
		if(typeof conf1[key] !== 'undefined') {
			result[key] = conf1[key];
		}
	});
	return result;
}

function getEnvKey(key) {
	var result = process.env[key];
	if(typeof result === "undefined") {
		result = process.env[changeCase.snakeCase(key).toUpperCase()];
	}
	return result;
}

function validateConfig(description, data) {
  var keys = Object.keys(description);
  for(var i=0; i < keys.length; i++) {
    var descr = description[keys[i]];
    var el = data[keys[i]];
    if(descr.required) {
     if(el === null || typeof el === 'undefined') {
       if(typeof descr.error === 'string') {
         return new Error(descr.error);
       } else {
         return new Error("Missing required config value: " + keys[i]);
       }
     }
    }
  }
}

var configLoaders = {
  "jsonData": function(description, options, callback) {
    if(typeof options.jsonData === 'undefined') {
      return callback(null, {});
    }
    var data;
    try {
      data = JSON.parse(options.jsonData);
    } catch(ex) {
      callback("Could not load jsonData: " + ex);
    }
    callback(null, data);
  },
	"environment": function(description, options, callback) {
		var result = {};
		async.each(Object.keys(description), function(key, cb) {
			result[key] = getEnvKey(key);
			cb(null);
		}, function(err) {
			return callback(err, result);
		});
	},
	"json": function(description, options, callback) {
		var result = {};
		async.detectSeries(options.configFolders, function(apath, cb) {
			fs.readFile(path.join(apath, options.filePrefix + '.json'), function(err, res) {
				if(err) return cb(false);
				var conf;
				try {
					conf = JSON.parse(res);
					result = conf;
				} catch(ex) {
					return cb(false);
				}
				cb(true);
			});
		}, function(ignored) {
			callback(null, result);
		});
	},
};

module.exports.loadConfig = function(description, options, callback) {
	var keys = Object.keys(description);
	if(typeof options === 'function') {
		callback = options;
		options = {};
	}
	if(typeof options === 'undefined') options = {};

	var deferred = Q.defer();

	// Second default format of key: value; normalize it
	keys.forEach(function(key) {
		if(typeof description[key] !== 'object' || Array.isArray(description[key]) || description[key] === null) {
			description[key] = {default: description[key]};
		}
	});

	var defaultConfig = {};
	keys.forEach(function(key) {
		if(typeof description[key].default !== 'undefined') {
			defaultConfig[key] = description[key].default;
		}
	});

	var dirsToTry = [];
	if(typeof options.configFolders === 'string') {
		dirsToTry.push(options.configFolders);
	} else if(Array.isArray(options.configFolders)) {
		// Good
	} else {
		dirsToTry.push('.');
	}
	dirsToTry.push(process.cwd());
	options.configFolders = dirsToTry;

	if(!Array.isArray(options.order)) {
		options.order = ["jsonData", "environment", "json", "yaml", "defaults"];
	}
	if(typeof options.filePrefix !== "string") {
		options.filePrefix = "config";
	}

	options.order = options.order.filter(function(ct) { return typeof configLoaders[ct] === 'function'; });

  async.map(options.order, function(el, asyncb) {
    var fn = configLoaders[el];
    fn(description, options, asyncb);
  }, function(err, resultArr) {
    // TODO, maybe handle this err
    resultArr.push(defaultConfig);
    var result = resultArr.reduce(mergeConfigs);

    err = validateConfig(description, result);
    if(err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  });

	return deferred.promise.nodeify(callback);
};
