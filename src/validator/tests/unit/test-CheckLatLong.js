/*
 * Tests errors and successes of the CheckLatLong rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckLatLong = require("../../../rules/CheckLatLong");
const CSVParser = require("../../../rules/CSVParser");
const MemoryWriterStream = require("../MemoryWriterStream");

QUnit.test( "CheckLatLong: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
	};

	const rule = new CheckLatLong(config);

	// Check general rule creation and as well as absent "Type" property.
	assert.ok(rule, "Rule was created.");
});

QUnit.test( "CheckLatLong: Check For Absent LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured without a 'latitudeColumn' property.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Non-Number LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : "foo",
		"numHeaderRows" : 1,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a non-number 'latitudeColumn'. Got 'foo'.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Negative LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : -1,
		"numHeaderRows" : 1,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a negative 'latitudeColumn'. Got '-1'.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Non-Integer LatitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : 1.1,
		"numHeaderRows" : 1,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
		assert.equal(logResults[0].description, "Configured with a non-integer 'latitudeColumn'. Got '1.1', using 1.");
		done();
	});


});


QUnit.test( "CheckLatLong: Check For Absent LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : 1,
		"numHeaderRows" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured without a 'longitudeColumn' property.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Non-Number LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : 1,
		"longitudeColumn" : "foo",
		"numHeaderRows" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a non-number 'longitudeColumn'. Got 'foo'.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Negative LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : 1,
		"longitudeColumn" : -1,
		"numHeaderRows" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a negative 'longitudeColumn'. Got '-1'.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Non-Integer LongitudeColumn Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : 1,
		"longitudeColumn" : 1.1,
		"numHeaderRows" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1,1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
		assert.equal(logResults[0].description, "Configured with a non-integer 'longitudeColumn'. Got '1.1', using 1.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Identical Latitude and LongitudeColumn Property Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"latitudeColumn" : 1,
		"longitudeColumn" : 1,
		"numHeaderRows" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1,1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with identical latitudeColumn and longitudeColumn property values.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Absent NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"longitudeColumn" : 0,
		"latitudeColumn" : 1,
		"numHeaderRows" : 1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
		assert.equal(logResults[0].description, "Configured without a nullEpsilon property. Using 0.01.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Non-Number NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"longitudeColumn" : 0,
		"latitudeColumn" : 1,
		"nullEpsilon" : "foo",
		"numHeaderRows" : 1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a non-number nullEpsilon. Got 'foo'.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Negative NullIslandEpsilon Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"longitudeColumn" : 0,
		"latitudeColumn" : 1,
		"nullEpsilon" : -0.1,
		"numHeaderRows" : 1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
		assert.equal(logResults[0].description, "Configured with a negative nullEpsilon. Got '-0.1'. Using 0.1.");
		done();
	});


});

QUnit.test( "CheckLatLong: Check For Bad Column Index", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Row 2 has insufficient columns.");
		done();
	});
});

QUnit.test( "CheckLatLong: Check For Non-Number Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);
	const done = assert.async();
	const data = "Lat,Long\nfoo,bar";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 2, `Expected two errors but got ${logResults.length}.`);
		if (logResults.length >= 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Latitude is not a number in row 2. Got 'foo'.");
			if (logResults.length >= 2) {
				assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
				assert.equal(logResults[1].description, "Longitude is not a number in row 2. Got 'bar'.");
			}
		}
		done();
	});
});

QUnit.test( "CheckLatLong: Check For Out of Range Lat/Long Values", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n-91,-200\n91,200";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 4, `Expected four errors but got ${logResults.length}.`);
		if (logResults.length >= 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Latitude is out of range in row 2. Got '-91'.");
			if (logResults.length >= 2) {
				assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
				assert.equal(logResults[1].description, "Longitude is out of range in row 2. Got '-200'.");
				if (logResults.length >= 3) {
					assert.equal(logResults[2].type, "Error", "Expected an 'Error'.");
					assert.equal(logResults[2].description, "Latitude is out of range in row 3. Got '91'.");
					if (logResults.length >= 4) {
						assert.equal(logResults[3].type, "Error", "Expected an 'Error'.");
						assert.equal(logResults[3].description, "Longitude is out of range in row 3. Got '200'.");
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
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1,
		"latitudeColumn" : 0,
		"longitudeColumn" : 1,
		"nullEpsilon" : 0.1
	};

	const rule = new CheckLatLong(config);
	const parser = new CSVParser(config, rule);

	const done = assert.async();
	const data = "Lat,Long\n43.6532,79.3832\n41.2865,174.7762";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, `Expected no errors but got ${logResults.length}.`);
		done();
	});
});
