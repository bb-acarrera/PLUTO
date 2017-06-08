/*
 * Tests basic validator initialization.
 */
const Validator = require("../../validator");

QUnit.test( "Create Validator Test", function( assert ) {
	const validatorConfig = {
		"RootDirectory" : ".",
		"RulesetDirectory" : "src/examples",
		"RulesDirectory" : "src/examples",
		"TempDirectory" : "/var/tmp",
		"InputDirectory" : "data",
		"OutputDirectory" : "results",
		"LogDirectory" : "results/logs",
		"RuleSet" : "exampleRuleSetConfig.json"
	};

	validatorConfig.scriptName = __filename;
	const validator = new Validator(validatorConfig);

	assert.ok(validator, "Validator was created.");
	assert.ok(validator.config, "Validator object has a config object.");
});
