# EuNodeConfig

**NOTE, THIS IS A WORK IN PROGRESS AND NOT COMPLETE AT THIS TIME**
To see what works, look at the test(s).

Node config is a simple library for loading configuration from the environment
and various file formats. It allows your users to specify their configs in
various formats and takes care of parsing the formats appropriately for you.

## Usage

This module exports only one function: `loadConfig`.

```javascript
var configLoader = require('node-config');
configLoader.loadConfig({
	username: {
		default: "bob", // A config with a default value can't be required
	},
	username2: "anotherDefaultFormat",
	secure: {
		required: true,
		error: "Missing required config value: secure" // This default message will be printed if you put error: true. This can only be used on required keys
	},
	anotherConfigKey: {
		error: true
	},
	finalConfigKey: {} // This config value will not be required and might not be in the object returned
}, {
	configFolders: ['/etc/myconf'],                       // Optional, defaults to working directory and then process base directory
	filePrefix: 'part-before-the-dot',                    // Optional, defaults to config
	order: ["string", "environment", "json", "yaml", "defaults"], // Optional, defaults to the value shown left; earlier values will override later values
	                                                      // other options include "js" to load from a .js file
	configString: '{"key": "value"}',                     // The 'string' source above.
}, function(err, config) {
	console.log("Config loaded: " + config);
});
```

## Formats supported

### .yaml, .json, and .js
From the above description, your config will be loaded from a file if it begins
with your filePrefix (default config) and ends with ".json" or ".yaml". If you
enable "loadJsConfigs" it will also load .js extension files.

### Environment variables
Environment variables matching either your config key or your config key
converted to upper-case and with camelcasing normalized to underscore
seperation will be used.

For example, the config key "configKey" will be accessed as either the
environment variable "configKey" or "CONFIG\_KEY"
