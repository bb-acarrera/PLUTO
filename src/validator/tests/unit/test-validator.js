/*
 * Tests basic validator initialization.
 */
const Validator = require("../../validator");
const DataAPI = require("../../../api/DataAPI");

QUnit.test( "Create Validator Test", function( assert ) {
	const validatorConfig = {
		"RootDirectory" : "/Users/ptokarchuk/git/mapvalidator",
		"PluginsDirectory" : "src/default",
		"RulesetDirectory" : "src/examples",
		"RulesDirectory" : "src/examples",
		"TempDirectory" : "/var/tmp",
		"Plugins" : {
			"Data" : {
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
	const validator = new Validator(validatorConfig);

	assert.ok(validator, "Validator was created.");
	assert.ok(validator.config, "Validator object has a config object.");

	assert.ok(validator.dataAccessor, "Validator has a dataAccessor.");
	assert.ok(validator.dataAccessor instanceof DataAPI, "Validator dataAccessor is a DataAPI class.");
});
