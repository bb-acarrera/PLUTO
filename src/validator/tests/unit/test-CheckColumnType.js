/*
 * Tests errors and successes of the CheckColumnType rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckColumnType = require("../../../examples/CheckColumnType");
const RuleAPI = require("../../../api/RuleAPI");

QUnit.test( "CheckColumnType: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger
	};

	const rule = new CheckColumnType(config);

	// Check general rule creation and as well as absent "Type" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'Type' property.");
});

QUnit.test( "CheckColumnType: Check Unknown Type Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "foo"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description,
		"Configured with an unrecognized data type. Expected 'string', 'number', or 'regex' but got 'foo'.");
});

QUnit.test( "CheckColumnType: Check Incomplete RegEx Type Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "regex"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Type is 'regex' but no 'RegEx' property defined'.");
});

QUnit.test( "CheckColumnType: Check For Absent NumberOfHeaderRows property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a 'NumberOfHeaderRows' property. Using 0.");
});

QUnit.test( "CheckColumnType: Check For Non-Number NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : "foo"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-number NumberOfHeaderRows. Got 'foo', using 0.");
});

QUnit.test( "CheckColumnType: Check For Negative NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : -1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative NumberOfHeaderRows. Got '-1', using 0.");
});

QUnit.test( "CheckColumnType: Check For Non-Integer NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1.1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer NumberOfHeaderRows. Got '1.1', using 1.");
});

QUnit.test( "CheckColumnType: Check For Absent Column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'Column' property.");
});

QUnit.test( "CheckColumnType: Check For Non-Number Column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1,
		"Column" : "foo"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number Column. Got 'foo'.");
});

QUnit.test( "CheckColumnType: Check For Negative Column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1,
		"Column" : -1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative Column. Got '-1'.");
});

QUnit.test( "CheckColumnType: Check For Non-Integer Column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1,
		"Column" : 1.1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer Column. Got '1.1', using 1.");
});

QUnit.test( "CheckColumnType: Check For Bad Column Count", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1,
		"Column" : 1
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1 has insufficient columns.");
		}
		done();
	});

	const data = "Column 0\nfoo";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Non-Number Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1,
		"Column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1, Column 0: Expected a number but got foo.");
		}
		done();
	});

	const data = "Column 0\nfoo";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Valid Number Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : 1,
		"Column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});

	const data = "Column 0\n3.14";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Failing RegEx Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "regex",
		"RegEx" : "a+",
		"NumberOfHeaderRows" : 1,
		"Column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1, Column 0: Expected a regex but got bbbb.");
		}
		done();
	});

	const data = "Column 0\nbbbb";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Passing RegEx Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "regex",
		"RegEx" : "a+",
		"NumberOfHeaderRows" : 1,
		"Column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});

	const data = "Column 0\naaaa";
	rule.useMethod(data);
});
