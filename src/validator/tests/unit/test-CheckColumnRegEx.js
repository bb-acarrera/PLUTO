/*
 * Tests errors and successes of the CheckColumnRegEx rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CheckColumnRegEx = require("../../../rules/CheckColumnRegEx");
const CSVParser = require("../../../rules/CSVParser");
const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");
const MemoryWriterStream = require("../MemoryWriterStream");

QUnit.test( "CheckColumnRegEx: Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
	};

	const rule = new CheckColumnRegEx(config);

	// Check general rule creation and as well as absent "Type" property.
	assert.ok(rule, "Rule was created.");

	assert.ok(logger.getCount(ErrorHandlerAPI.ERROR) > 0, "Expected errors");
});

QUnit.test( "CheckColumnRegEx: Check For Absent column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$"
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
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$",
		"column" : "foo",
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);

	const data = "Column 0\nfoo";
	const done = assert.async();
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a non-number 'column'. Got 'foo'.");
		done();
	});


});

QUnit.test( "CheckColumnRegEx: Check For Negative column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$",
		"column" : -1,
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);

	const data = "Column 0\nfoo";
	const done = assert.async();
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Configured with a negative 'column'. Got '-1'.");
		done();
	});


});

QUnit.test( "CheckColumnRegEx: Check For Non-Integer column Property", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$",
		"column" : 1.1,
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);

	const data = "Column 0\nfoo";
	const done = assert.async();
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.ok(logResults.length >= 1, "Expect at least one result.");	// Only care about the first one for now.
		assert.equal(logResults[0].type, "Warning", "Expected an 'Warning'.");
		assert.equal(logResults[0].description, "Configured with a non-integer 'column'. Got '1.1', using 1.");
		done();
	});


});

QUnit.test( "CheckColumnRegEx: Check For Bad Column Index", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$",
		"numHeaderRows" : 1,
		"column" : 1
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);

	const data = "Column 0\nfoo";
	const done = assert.async();
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 2 has insufficient columns.");
		}
		done();
	});
});

QUnit.test( "CheckColumnRegEx: Check For Failing RegEx Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$",	// A string of 1 or more a's.
		"numHeaderRows" : 1,
		"column" : 0,
		"failType": "Error"
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);
	const data = "Column 0\nbbbb";
	const done = assert.async();
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
			assert.equal(logResults[0].description, "Row 2, Column 0: Expected a match of ^a+$ but got bbbb.");
		}
		done();
	});
});

QUnit.test( "CheckColumnRegEx: Check For Passing RegEx Column Value", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"type" : "regex",
		"regex" : "^a+$",
		"numHeaderRows" : 1,
		"column" : 0
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);
	const done = assert.async();
	const data = "Column 0\naaaa";
	parser._run( MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		done();
	});
});

QUnit.test( "CheckColumnRegEx: Check For Failing RegEx Column Value With Warning", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"regex" : "^a+$",	// A string of 1 or more a's.
		"numHeaderRows" : 1,
		"column" : 0,
		"failType": "Warning"
	};

	const rule = new CheckColumnRegEx(config);
	const parser = new CSVParser(config, rule);
	const data = "Column 0\nbbbb";
	const done = assert.async();
	parser._run(MemoryWriterStream.getRuleStreamObject(data)).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, `Expect single result, got ${logResults.length}.`);
		if (logResults.length == 1) {
			assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
			assert.equal(logResults[0].description, "Row 2, Column 0: Expected a match of ^a+$ but got bbbb.");
		}
		done();
	});
});
