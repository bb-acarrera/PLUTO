/*
 * Tests errors and successes of the CheckLatLong rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckLatLong = require("../../../examples/CheckLatLong");
const RuleAPI = require("../../../api/RuleAPI");

QUnit.test( "CheckLatLong: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger
	};

	const rule = new CheckLatLong(config);

	// Check general rule creation and as well as absent "Type" property.
	assert.ok(rule, "Rule was created.");
});

QUnit.test( "CheckLatLong: Check For Absent NumberOfHeaderRows property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a 'NumberOfHeaderRows' property. Using 0.");
});

QUnit.test( "CheckLatLong: Check For Non-Number NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"Type" : "number",
		"NumberOfHeaderRows" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-number NumberOfHeaderRows. Got 'foo', using 0.");
});

QUnit.test( "CheckLatLong: Check For Negative NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : -1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative NumberOfHeaderRows. Got '-1', using 0.");
});

QUnit.test( "CheckLatLong: Check For Non-Integer NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer NumberOfHeaderRows. Got '1.1', using 1.");
});

QUnit.test( "CheckLatLong: Check For Absent LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'LatitudeColumn' property.");
});

QUnit.test( "CheckLatLong: Check For Non-Number LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number LatitudeColumn. Got 'foo'.");
});

QUnit.test( "CheckLatLong: Check For Negative LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : -1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative LatitudeColumn. Got '-1'.");
});

QUnit.test( "CheckLatLong: Check For Non-Integer LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 1.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer LatitudeColumn. Got '1.1', using 1.");
});


QUnit.test( "CheckLatLong: Check For Absent LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'LongitudeColumn' property.");
});

QUnit.test( "CheckLatLong: Check For Non-Number LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 1,
		"LongitudeColumn" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number LongitudeColumn. Got 'foo'.");
});

QUnit.test( "CheckLatLong: Check For Negative LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 1,
		"LongitudeColumn" : -1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative LongitudeColumn. Got '-1'.");
});

QUnit.test( "CheckLatLong: Check For Non-Integer LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 1,
		"LongitudeColumn" : 1.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer LongitudeColumn. Got '1.1', using 1.");
});

QUnit.test( "CheckLatLong: Check For Identical Latitude and LongitudeColumn Property Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 1,
		"LongitudeColumn" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with identical LatitudeColumn and LongitudeColumn property values.");
});

QUnit.test( "CheckLatLong: Check For Absent NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LongitudeColumn" : 0,
		"LatitudeColumn" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a NullIslandEpsilon property. Using 0.01.");
});

QUnit.test( "CheckLatLong: Check For Non-Number NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LongitudeColumn" : 0,
		"LatitudeColumn" : 1,
		"NullIslandEpsilon" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number NullIslandEpsilon. Got 'foo'.");
});

QUnit.test( "CheckLatLong: Check For Negative NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LongitudeColumn" : 0,
		"LatitudeColumn" : 1,
		"NullIslandEpsilon" : -0.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative NullIslandEpsilon. Got '-0.1'. Using 0.1.");
});

QUnit.test( "CheckLatLong: Check For Bad Column Count", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 0,
		"LongitudeColumn" : 1,
		"NullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 1 has insufficient columns.");
		done();
	});

	const data = "Lat,Long\n1";
	rule.useMethod(data);
});

QUnit.test( "CheckLatLong: Check For Non-Number Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 0,
		"LongitudeColumn" : 1,
		"NullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 2, `Expected two errors but got ${logResults.length}.`);
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Latitude is not a number in row 1. Got 'foo'.");
		assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[1].description, "Longitude is not a number in row 1. Got 'bar'.");
		done();
	});

	const data = "Lat,Long\nfoo,bar";
	rule.useMethod(data);
});

QUnit.test( "CheckLatLong: Check For Out of Range Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 0,
		"LongitudeColumn" : 1,
		"NullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 4, `Expected four errors but got ${logResults.length}.`);
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Latitude is out of range in row 1. Got '-91'.");
		assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[1].description, "Longitude is out of range in row 1. Got '-200'.");
		assert.equal(logResults[2].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[2].description, "Latitude is out of range in row 2. Got '91'.");
		assert.equal(logResults[3].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[3].description, "Longitude is out of range in row 2. Got '200'.");
		done();
	});

	const data = "Lat,Long\n-91,-200\n91,200";
	rule.useMethod(data);
});

QUnit.test( "CheckLatLong: Check Valid Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"NumberOfHeaderRows" : 1,
		"LatitudeColumn" : 0,
		"LongitudeColumn" : 1,
		"NullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	rule.on(RuleAPI.NEXT, (data) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, `Expected no errors but got ${logResults.length}.`);
		done();
	});

	const data = "Lat,Long\n43.6532,79.3832\n41.2865,174.7762";
	rule.useMethod(data);
});
