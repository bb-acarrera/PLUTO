/*
 * Tests errors and successes of the CheckColumnRegEx rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckColumnRegEx = require("../../../rules/CheckColumnRegEx");
const RuleAPI = require("../../../api/RuleAPI");

QUnit.test( "CheckColumnRegEx: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger
	};

	const rule = new CheckColumnRegEx(config);

	// Check general rule creation and as well as absent "Type" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "No 'regex' property defined'.");
});

QUnit.test( "CheckColumnRegEx: Check For Absent NumberOfHeaderRows property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a 'numberOfHeaderRows' property. Using 0.");
});

QUnit.test( "CheckColumnRegEx: Check For Non-Number NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : "foo"
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'numberOfHeaderRows'. Got 'foo', using 0.");
});

QUnit.test( "CheckColumnRegEx: Check For Negative NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : -1
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative 'numberOfHeaderRows'. Got '-1', using 0.");
});

QUnit.test( "CheckColumnRegEx: Check For Non-Integer NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1.1
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'numberOfHeaderRows'. Got '1.1', using 1.");
});

QUnit.test( "CheckColumnRegEx: Check For Absent column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'column' property.");
});

QUnit.test( "CheckColumnRegEx: Check For Non-Number column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1,
		"column" : "foo"
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'column'. Got 'foo'.");
});

QUnit.test( "CheckColumnRegEx: Check For Negative column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1,
		"column" : -1
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative 'column'. Got '-1'.");
});

QUnit.test( "CheckColumnRegEx: Check For Non-Integer column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1,
		"column" : 1.1
	};

	const rule = new CheckColumnRegEx(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'column'. Got '1.1', using 1.");
});

QUnit.test( "CheckColumnRegEx: Check For Bad Column Count", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1,
		"column" : 1
	};

	const rule = new CheckColumnRegEx(config);
	const data = "Column 0\nfoo";
	const done = assert.async();
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1 has insufficient columns.");
		}
		done();
	});
});

QUnit.test( "CheckColumnRegEx: Check For Failing RegEx Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"regex" : "^a+$",	// A string of 1 or more a's.
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnRegEx(config);
	const data = "Column 0\nbbbb";
	const done = assert.async();
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 1, Column 0: Expected a match of ^a+$ but got bbbb.");
		}
		done();
	});
});

QUnit.test( "CheckColumnRegEx: Check For Passing RegEx Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "regex",
		"regex" : "^a+$",
		"numberOfHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnRegEx(config);

	const done = assert.async();
	const data = "Column 0\naaaa";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});
});
