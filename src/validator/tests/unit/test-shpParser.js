/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const ShpParser = require("../../../rules/shpParser");
const TableRuleAPI = require("../../../api/TableRuleAPI");

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
	const data = "Column1\n1234";
	parser._run( { file: './src/validator/tests/world_borders' } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		done();
	});
});


QUnit.module("");