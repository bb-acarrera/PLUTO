/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const ShpParser = require("../../../rules/shpParser");
const TableRuleAPI = require("../../../api/TableRuleAPI");


const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");

class TestTableRule extends TableRuleAPI {
	constructor(config) {
		super(config);

	}

	start(parser) {
		this.parser = parser;
		this.rowCount = 0;
	}

	processRecord(record, rowId) {
		this.rowCount++;

		if(this.config.async) {

			return new Promise((resolve) => {

				setTimeout(() =>{
					resolve(record);
				}, 100);


			});
		}

		return record;
	}

	finish() {
		this.finished = true;
	}

	get processHeaderRows() {
		return true;
	}
}

QUnit.module("shpParser");

QUnit.test( "Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1
	};

	const rule = new ShpParser(config, new TestTableRule());

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no errors or warnings");
});

QUnit.test( "Creation Test No Rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1
	};

	const rule = new ShpParser(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
});

QUnit.test( "valid shapefile", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger,
		        tempDirectory: "./tmp"
	        }
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');
		done();
	});
});

QUnit.test( "async rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		},
		async: true
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');
		done();
	});
});


/////////////////////////////////////////////////////////
// integration test
QUnit.test( " End to End CheckColumnCount Rule Test", function(assert){
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			"rootDirectory" : "./src",
			"tempDirectory" : "./tmp"
		},
		"rulesDirectory" : "rules",
		"inputDirectory" : "",
		"outputDirectory" : "results",
		"ruleset" : "Test Data Ruleset"
	};

	const done = assert.async();

	const ruleset = {
		name : "Test Data Ruleset",
		rules : [
			{
				filename : "CheckColumnCount",
				config : {
					id : 1,
					columns : 11
				}
			}
		],
		parser: {
			filename: "shpParser",
			config: {
			}
		}
	};

	const dbProxy = new DataProxy(ruleset,
		(runId, log, ruleSetID, inputFile, outputFile) => {
			assert.ok(log, "Expected log to be created");
			assert.equal(log.length, 0, "Expected no log entries");
			assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
		},
		done);

	const vldtr = new validator(config, dbProxy.getDataObj());


	vldtr.runRuleset("src/validator/tests/world_borders.zip", "output_borders.zip", 'UTF8');

});

QUnit.test( " End to End CheckColumnCount Rule Test Failure", function(assert){
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			"rootDirectory" : "./src",
			"tempDirectory" : "./tmp"
		},
		"rulesDirectory" : "rules",
		"inputDirectory" : "",
		"outputDirectory" : "results",
		"ruleset" : "Test Data Ruleset"
	};

	const done = assert.async();

	const ruleset = {
		name : "Test Data Ruleset",
		rules : [
			{
				filename : "CheckColumnCount",
				config : {
					id : 1,
					columns : 12

				}
			}
		],
		parser: {
			filename: "shpParser",
			config: {
			}
		}
	};

	const dbProxy = new DataProxy(ruleset,
		(runId, log, ruleSetID, inputFile, outputFile) => {
			assert.ok(log, "Expected log to be created");
			assert.ok(vldtr.abort, "Expected validator to succeed without aborting");
		},
		done);

	const vldtr = new validator(config, dbProxy.getDataObj());


	vldtr.runRuleset("src/validator/tests/world_borders.zip", "output.zip", 'UTF8');

});


QUnit.module("");