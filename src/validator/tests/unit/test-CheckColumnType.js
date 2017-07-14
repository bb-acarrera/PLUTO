/*
 * Tests errors and successes of the CheckColumnType rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckColumnType = require("../../../runtime/rules/CheckColumnType");
const RuleAPI = require("../../../runtime/api/RuleAPI");

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
	assert.equal(logResults[0].description, "Configured without a 'type' property.");
});

QUnit.test( "CheckColumnType: Check Unknown Type Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "foo"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description,
		"Configured with an unrecognized data type. Expected 'string', 'float', 'integer', or 'number' but got 'foo'.");
});

QUnit.test( "CheckColumnType: Check For Absent NumberOfHeaderRows property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a 'numberOfHeaderRows' property. Using 0.");
});

QUnit.test( "CheckColumnType: Check For Non-Number NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : "foo"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'numberOfHeaderRows'. Got 'foo', using 0.");
});

QUnit.test( "CheckColumnType: Check For Negative NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : -1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative 'numberOfHeaderRows'. Got '-1', using 0.");
});

QUnit.test( "CheckColumnType: Check For Non-Integer NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : 1.1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'numberOfHeaderRows'. Got '1.1', using 1.");
});

QUnit.test( "CheckColumnType: Check For Absent column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : 1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'column' property.");
});

QUnit.test( "CheckColumnType: Check For Non-Number column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : 1,
		"column" : "foo"
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'column'. Got 'foo'.");
});

QUnit.test( "CheckColumnType: Check For Negative column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : 1,
		"column" : -1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative 'column'. Got '-1'.");
});

QUnit.test( "CheckColumnType: Check For Non-Integer column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : 1,
		"column" : 1.1
	};

	const rule = new CheckColumnType(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'column'. Got '1.1', using 1.");
});

QUnit.test( "CheckColumnType: Check For Bad Column Count", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : 1,
		"column" : 1
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
		"type" : "number",
		"numberOfHeaderRows" : 1,
		"column" : 0
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
		"type" : "number",
		"numberOfHeaderRows" : 1,
		"column" : 0
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

QUnit.test( "CheckColumnType: Check For Non-Float Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "float",
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1, Column 0: Expected a float but got foo.");
		}
		done();
	});

	const data = "Column 0\nfoo";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Valid Float Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "float",
		"numberOfHeaderRows" : 1,
		"column" : 0
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

QUnit.test( "CheckColumnType: Check For Valid Float (int) Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "float",
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});

	const data = "Column 0\n3";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Non-Integer Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "integer",
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1, Column 0: Expected a integer but got foo.");
		}
		done();
	});

	const data = "Column 0\nfoo";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Invalid Integer Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "integer",
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1, Column 0: Expected a integer but got 3.14.");
		}
		done();
	});

	const data = "Column 0\n3.14";
	rule.useMethod(data);
});

QUnit.test( "CheckColumnType: Check For Valid Integer Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "integer",
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnType(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});

	const data = "Column 0\n3";
	rule.useMethod(data);
});
