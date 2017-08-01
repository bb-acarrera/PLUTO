/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckColumnCount = require("../../../rules/CheckColumnCount");
const RuleAPI = require("../../../api/RuleAPI");

QUnit.test( "CheckColumnCount: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger
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
		"columns" : "foo"
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
		"columns" : "-1"
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
		"columns" : "1.1"
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
		"columns" : "1"
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
		"columns" : "1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	const data = "Column1";
	rule._run( { data: data } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});
});

QUnit.test( "CheckColumnCount: Check Valid Count Test 2", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");
		done();
	});
});

QUnit.test( "CheckColumnCount: Check Insufficient Columns.", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "2"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 0 has wrong number of columns. Got 1.");
		done();
	});
});

QUnit.test( "CheckColumnCount: Check Too Many Columns.", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"columns" : "1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234,5678";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 1 has wrong number of columns. Got 2.");
		done();
	});
});
