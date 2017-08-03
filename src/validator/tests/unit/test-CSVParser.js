/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CSVParser = require("../../../rules/CSVParser");
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

QUnit.test( "CSVParser: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1
	};

	const rule = new CSVParser(config, new TestTableRule());

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no errors or warnings");
});

QUnit.test( "CSVParser: Creation Test No Rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1
	};

	const rule = new CSVParser(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
});

QUnit.test( "CSVParser: Check For Absent NumberOfHeaderRows property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger
	};

	const rule = new CSVParser(config, new TestTableRule());

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a 'numberOfHeaderRows' property. Using 0.");
});

QUnit.test( "CSVParser: Check For Non-Number NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : "foo"
	};

	const rule = new CSVParser(config, new TestTableRule());

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'numberOfHeaderRows'. Got 'foo', using 0.");
});

QUnit.test( "CSVParser: Check For Negative NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : -1
	};

	const rule = new CSVParser(config, new TestTableRule());

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative 'numberOfHeaderRows'. Got '-1', using 0.");
});

QUnit.test( "CSVParser: Check For Non-Integer NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1.1
	};

	const rule = new CSVParser(config, new TestTableRule());

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'numberOfHeaderRows'. Got '1.1', using 1.");
});

QUnit.test( "CSVParser: Check Valid Rows processed Exluding Header", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1
	};

	const rule = new TestTableRule(config);

	const parser = new CSVParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	const data = "Column1\n1234";
	parser._run( { data: data } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.equal(rule.finished, true, "Rule finished.");
		assert.equal(rule.rowCount, 2, "2 rows processed.")
		done();
	});
});

