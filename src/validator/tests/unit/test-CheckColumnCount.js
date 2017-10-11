/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CSVParser = require("../../../rules/CSVParser");
const CheckColumnCount = require("../../../rules/CheckColumnCount");

QUnit.test( "CheckColumnCount: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'columns' property.");
});

QUnit.test( "CheckColumnCount: Check Non-Number Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "foo",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number columns. Got 'foo'.");
});

QUnit.test( "CheckColumnCount: Check Negative Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "-1",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative columns. Got '-1'.");
});

QUnit.test( "CheckColumnCount: Check Non-Integer Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1.1",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-integer columns. Got '1.1'.");
});

QUnit.test( "CheckColumnCount: Check Valid Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no errors.");
});

QUnit.test( "CheckColumnCount: Check Valid Count Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);

	const parser = new CSVParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	const data = "Column1";
	parser._run( { data: data } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});
});

QUnit.test( "CheckColumnCount: Check Valid Count Test 2", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);
	const parser = new CSVParser(config, rule);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234";
	parser._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");
		done();
	});
});

QUnit.test( "CheckColumnCount: Check Insufficient Columns.", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "2",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);
	const parser = new CSVParser(config, rule);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234";
	parser._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 2, "Expect two results.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 0 has too few of columns. Got 1.");
		done();
	});
});

QUnit.test( "CheckColumnCount: Check Too Many Columns.", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnCount(config);
	const parser = new CSVParser(config, rule);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234,5678";
	parser._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
		assert.equal(logResults[0].description, "Row 1 has too many of columns. Got 2.");
		done();
	});
});
