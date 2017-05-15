/*
 * Tests basic integration between the server and validation classes.
 */
const Server = require("../../server");
const DataAPI = require("../../../api/DataAPI");

QUnit.test( "Create Server Test", function( assert ) {
	const serverConfig = {
		"RootDirectory" : ".",
		"TempDirectory" : "/var/tmp",
		"Port" : "8000"
	};

	const validatorConfig = {
		"RootDirectory" : ".",
		"PluginsDirectory" : "src/default",
		"RulesetDirectory" : "src/examples",
		"RulesDirectory" : "src/examples",
		"TempDirectory" : "/var/tmp",
		"Plugins" : {
			"DataAPI" : {
				"FileName" : "DefaultData",
					"Config" : {
					"InputDirectory" : "data",
						"OutputDirectory" : "results",
						"LogDirectory" : "results/logs"
				}
			}
		},
		"RuleSet" : "exampleRuleSetConfig.json"
	};

	validatorConfig.scriptName = __filename;
	const server = new Server(serverConfig, validatorConfig);

	assert.ok(server, "Got a server.");
	assert.ok(server.config, "Server has a config file.");
	assert.ok(server.config.validator, "Server has a validator.");
	assert.ok(server.config.validator.config, "Server's validator object has a config object.");

	assert.ok(server.config.validator.dataAccessor, "Server's validator has a dataAccessor.");
	assert.ok(server.config.validator.dataAccessor instanceof DataAPI, "Server's validator is a DataAPI class.");

	assert.ok(server.router, "Server got a router.");
});
