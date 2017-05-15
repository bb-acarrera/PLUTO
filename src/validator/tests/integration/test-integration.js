/*
 * Tests basic validator integration using the example rules.
 */
const fs = require("fs");
const path = require("path");

const Validator = require("../../validator");
const DataAPI = require("../../../api/DataAPI");

QUnit.test( "Run Validator Test", function( assert ) {
	const validatorConfig = {
		"RootDirectory" : ".",
		"PluginsDirectory" : "src/default",
		"RulesetDirectory" : "src/examples",						// Where to find the ruleset files.
		"TempDirectory" : "/var/tmp",
		"Plugins" : {
			"DataAPI" : {
				"FileName" : "DefaultData",	// Name of the DataAPI plug-in to use.
				"Config" : {				// This config is plug-in specific and not defined by the MapValidator.
					"RootDirectory" : ".",	// Overrides the RootDirectory from validatorConfig.
					"InputDirectory" : "src/examples/data",					// Relative to RootDirectory.
					"OutputDirectory" : "results",							// Relative to RootDirectory.
					"LogDirectory" : "results/logs"							// Relative to RootDirectory.
				}
			}
		},
		"RuleSet" : {
			"RulesDirectory" : "./src/examples/",	// Where the ruleset's rules are.
			"SourceFileName" : "simplemaps-worldcities-basic.csv",	// Overridden by command line arguments.
			"Encoding" : "utf8",									// Overridden by command line arguments.
			"ResultsFileName" : "results.csv",						// Overridden by command line arguments.
			"Name" : "Example RuleSet",								// Name to display in the UI.
			"Rules" : [
				{
					"FileName" : "RuleExampleUsingMethod",
					"Config" : {}
				},
				{
					"FileName" : "RuleExampleUsingFiles",
					"Config" : {}
				},
				{
					"FileName" : "RuleExampleUsingStreams",
					"Config" : {}
				},
				{
					"FileName" : "RuleExampleUsingCat",
					"Name" : "/bin/cat",
					"Config" : {}
				}
			]
		}
	};

	validatorConfig.scriptName = __filename;
	const validator = new Validator(validatorConfig);

	// Properties needed to run the ruleset will be pulled from the config.
	validator.runRuleset();

	const src  = fs.readFileSync(path.resolve(validator.dataAccessor.inputDirectory, validatorConfig.RuleSet.SourceFileName), 'utf8');
	const rslt = fs.readFileSync(path.resolve(validator.dataAccessor.outputDirectory, validatorConfig.RuleSet.ResultsFileName), 'utf8');

	// Confirm that the result is the same as the source. (This ruleset is composed of rules that copy their source to destination in different ways.)
	var same = src.length == rslt.length;
	for (var i = 0; same && i < src.length; i++)
		same = src.charAt(i) == rslt.charAt(i);

	assert.ok(same, "Source and Result files are the same.");
});
