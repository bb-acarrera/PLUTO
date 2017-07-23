/*
 * Tests errors and successes of the CheckLatLong rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckLatLong = require("../../../runtime/rules/CheckLatLong");
const RuleAPI = require("../../../runtime/api/RuleAPI");

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
		"type" : "number"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a 'numberOfHeaderRows' property. Using 0.");
});

QUnit.test( "CheckLatLong: Check For Non-Number NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"type" : "number",
		"numberOfHeaderRows" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'numberOfHeaderRows'. Got 'foo', using 0.");
});

QUnit.test( "CheckLatLong: Check For Negative NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : -1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative 'numberOfHeaderRows'. Got '-1', using 0.");
});

QUnit.test( "CheckLatLong: Check For Non-Integer NumberOfHeaderRows", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'numberOfHeaderRows'. Got '1.1', using 1.");
});

QUnit.test( "CheckLatLong: Check For Absent LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'latitudeColumn' property.");
});

QUnit.test( "CheckLatLong: Check For Non-Number LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'latitudeColumn'. Got 'foo'.");
});

QUnit.test( "CheckLatLong: Check For Negative LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : -1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative 'latitudeColumn'. Got '-1'.");
});

QUnit.test( "CheckLatLong: Check For Non-Integer LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 1.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'latitudeColumn'. Got '1.1', using 1.");
});


QUnit.test( "CheckLatLong: Check For Absent LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured without a 'longitudeColumn' property.");
});

QUnit.test( "CheckLatLong: Check For Non-Number LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 1,
		"longitudeColumn" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'longitudeColumn'. Got 'foo'.");
});

QUnit.test( "CheckLatLong: Check For Negative LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 1,
		"longitudeColumn" : -1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative 'longitudeColumn'. Got '-1'.");
});

QUnit.test( "CheckLatLong: Check For Non-Integer LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 1,
		"longitudeColumn" : 1.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'longitudeColumn'. Got '1.1', using 1.");
});

QUnit.test( "CheckLatLong: Check For Identical Latitude and LongitudeColumn Property Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 1,
		"longitudeColumn" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with identical latitudeColumn and longitudeColumn property values.");
});

QUnit.test( "CheckLatLong: Check For Absent NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"longitudeColumn" : 0,
		"latitudeColumn" : 1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured without a nullIslandEpsilon property. Using 0.01.");
});

QUnit.test( "CheckLatLong: Check For Non-Number NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"longitudeColumn" : 0,
		"latitudeColumn" : 1,
		"nullIslandEpsilon" : "foo"
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number nullIslandEpsilon. Got 'foo'.");
});

QUnit.test( "CheckLatLong: Check For Negative NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"longitudeColumn" : 0,
		"latitudeColumn" : 1,
		"nullIslandEpsilon" : -0.1
	};

	const rule = new CheckLatLong(config);

	const logResults = logger.getLog();
	assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
	assert.equal(logResults[0].description, "Configured with a negative nullIslandEpsilon. Got '-0.1'. Using 0.1.");
});

QUnit.test( "CheckLatLong: Check For Bad Column Count", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	const data = "Lat,Long\n1";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 1 has insufficient columns.");
		done();
	});
});

QUnit.test( "CheckLatLong: Check For Non-Number Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	const data = "Lat,Long\nfoo,bar";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 2, `Expected two errors but got ${logResults.length}.`);
		if (logResults.length >= 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Latitude is not a number in row 1. Got 'foo'.");
			if (logResults.length >= 2) {
				assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
				assert.equal(logResults[1].description, "Longitude is not a number in row 1. Got 'bar'.");
			}
		}
		done();
	});
});

QUnit.test( "CheckLatLong: Check For Out of Range Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	const data = "Lat,Long\n-91,-200\n91,200";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 4, `Expected four errors but got ${logResults.length}.`);
		if (logResults.length >= 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Latitude is out of range in row 1. Got '-91'.");
			if (logResults.length >= 2) {
				assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
				assert.equal(logResults[1].description, "Longitude is out of range in row 1. Got '-200'.");
				if (logResults.length >= 3) {
					assert.equal(logResults[2].type, "Error", "Expected an 'Error'.");
					assert.equal(logResults[2].description, "Latitude is out of range in row 2. Got '91'.");
					if (logResults.length >= 4) {
						assert.equal(logResults[3].type, "Error", "Expected an 'Error'.");
						assert.equal(logResults[3].description, "Longitude is out of range in row 2. Got '200'.");
					}
				}
			}
		}
		done();
	});
});

QUnit.test( "CheckLatLong: Check Valid Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		"_debugLogger" : logger,
		"numberOfHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullIslandEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);

	const done = assert.async();
	const data = "Lat,Long\n43.6532,79.3832\n41.2865,174.7762";
	rule._run( { data: data }).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, `Expected no errors but got ${logResults.length}.`);
		done();
	});
});
