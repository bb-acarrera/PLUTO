/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckColumnCount = require("../../../runtime/rules/CheckColumnCount");
const RuleAPI = require("../../../runtime/api/RuleAPI");

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
	assert.equal(logResults[0].description, "Configured without a Columns property.");
});

QUnit.test( "CheckColumnCount: Check Non-Number Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "foo"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number Columns. Got 'foo'.");
});

QUnit.test( "CheckColumnCount: Check Negative Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "-1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative Columns. Got '-1'.");
});

QUnit.test( "CheckColumnCount: Check Non-Integer Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "1.1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-integer Columns. Got '1.1'.");
});

QUnit.test( "CheckColumnCount: Check Valid Columns Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "1"
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
		"Columns" : "1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	const data = "Column1";
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});
	rule.useMethod(data);
});

QUnit.test( "CheckColumnCount: Check Valid Count Test 2", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234";
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");
		done();
	});
	rule.useMethod(data);
});

QUnit.test( "CheckColumnCount: Check Insufficient Columns.", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "2"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234";
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 0 has wrong number of columns.");
		done();
	});
	rule.useMethod(data);
});

QUnit.test( "CheckColumnCount: Check Too Many Columns.", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Columns" : "1"
	};

	const rule = new CheckColumnCount(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	const data = "Column1\n1234,5678";
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 1 has wrong number of columns.");
		done();
	});
	rule.useMethod(data);
});
