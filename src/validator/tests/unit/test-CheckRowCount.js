/*
 * Tests errors and successes of the CheckRowCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CSVParser = require("../../../rules/CSVParser");
const CheckRowCount = require("../../../rules/CheckRowCount");
const MemoryWriterStream = require("../MemoryWriterStream");

QUnit.test( "CheckRowCount: Absent Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	// Check general rule creation and as well as absent properties.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 4, "Expect four results.");
	for (var i = 0; i < 4; i++)
		assert.equal(logResults[i].type, "Error", "Expected an 'Error'.");

	assert.equal(logResults[0].description, "Configured without a 'minWarningThreshold' property.");
	assert.equal(logResults[1].description, "Configured without a 'maxWarningThreshold' property.");
	assert.equal(logResults[2].description, "Configured without a 'minErrorThreshold' property.");
	assert.equal(logResults[3].description, "Configured without a 'maxErrorThreshold' property.");
});

QUnit.test( "CheckRowCount: Check Non-Number minWarningThreshold Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : "foo",
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 4, "Expect four results.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-number 'minWarningThreshold'. Got 'foo'.");
});

QUnit.test( "CheckRowCount: Check Negative minWarningThreshold Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : "-1",
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 4, "Expect four results.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a negative 'minWarningThreshold'. Got '-1'.");
});

QUnit.test( "CheckRowCount: Check Non-Integer minWarningThreshold Property Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : "1.1",
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 4, "Expect four results.");
	assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
	assert.equal(logResults[0].description, "Configured with a non-integer 'minWarningThreshold'. Got '1.1'.");
});

QUnit.test( "CheckRowCount: Check Invalid Properties Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 1,
		"maxWarningThreshold" : 1,
		"minErrorThreshold" : 1,
		"maxErrorThreshold" : 1,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 4, "Expected 4 errors.");
	for (var i = 0; i < 4; i++)
		assert.equal(logResults[i].type, "Error", "Expected an 'Error'.");

	assert.equal(logResults[0].description, "minWarningThreshold (1) must be less than maxWarningThreshold (1).");
	assert.equal(logResults[1].description, "minErrorThreshold (1) must be less than maxErrorThreshold (1).");
	assert.equal(logResults[2].description, "minWarningThreshold (1) must be greater than minErrorThreshold (1).");
	assert.equal(logResults[3].description, "maxWarningThreshold (1) must be less than maxErrorThreshold (1).");
});

QUnit.test( "CheckRowCount: Check Valid Count Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 2,
		"maxWarningThreshold" : 4,
		"minErrorThreshold" : 1,
		"maxErrorThreshold" : 5,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const parser = new CSVParser(config, rule);
	
	assert.ok(rule, "Rule was created.");
	
	const done = assert.async();
	const data = "Column1\nfoo\nfoo\nfoo";	// 3 data rows. Shouldn't generate an error.
	parser._run( { data: data } ).then((result) => {
	
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors. Got " + logResults.length + ".");
		done();

	});
});

QUnit.test( "CheckRowCount: Check Low Count Warning Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 2,
		"maxWarningThreshold" : 4,
		"minErrorThreshold" : 1,
		"maxErrorThreshold" : 5,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const parser = new CSVParser(config, rule);
	
	assert.ok(rule, "Rule was created.");
	
	const done = assert.async();
	const data = "Column1\nfoo";	// 1 data row. Should generate a low count warning.
	parser._run( { data: data } ).then((result) => {
	
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
		assert.equal(logResults[0].description, "Number of rows (1) less than warning threshold (2).");
		done();

	});
});

QUnit.test( "CheckRowCount: Check Low Count Error Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 2,
		"maxWarningThreshold" : 4,
		"minErrorThreshold" : 1,
		"maxErrorThreshold" : 5,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const parser = new CSVParser(config, rule);
	
	assert.ok(rule, "Rule was created.");
	
	const done = assert.async();
	const data = "Column1";	// 0 data rows. Should generate a low count error.
	parser._run( { data: data } ).then((result) => {
	
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Number of rows (0) less than error threshold (1).");
		done();

	});
});

QUnit.test( "CheckRowCount: Check High Count Warning Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 2,
		"maxWarningThreshold" : 4,
		"minErrorThreshold" : 1,
		"maxErrorThreshold" : 5,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const parser = new CSVParser(config, rule);
	
	assert.ok(rule, "Rule was created.");
	
	const done = assert.async();
	const data = "Column1\nfoo\nfoo\nfoo\nfoo\nfoo";	// 5 data rows. Should generate a high count warning.
	parser._run( { data: data } ).then((result) => {
	
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
		assert.equal(logResults[0].description, "Number of rows (5) greater than warning threshold (4).");
		done();

	});
});

QUnit.test( "CheckRowCount: Check High Count Warning Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 2,
		"maxWarningThreshold" : 4,
		"minErrorThreshold" : 1,
		"maxErrorThreshold" : 5,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const parser = new CSVParser(config, rule);
	
	assert.ok(rule, "Rule was created.");
	
	const done = assert.async();
	const data = "Column1\nfoo\nfoo\nfoo\nfoo\nfoo\nfoo";	// 6 data rows. Should generate a high count error.
	parser._run( { data: data } ).then((result) => {
	
		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect single result.");
		assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
		assert.equal(logResults[0].description, "Number of rows (6) greater than error threshold (5).");
		done();

	});
});

QUnit.test( "CheckRowCount: Check Valid Output Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"minWarningThreshold" : 1,
		"maxWarningThreshold" : 5,
		"minErrorThreshold" : 2,
		"maxErrorThreshold" : 4,
		"numHeaderRows" : 1
	};

	const rule = new CheckRowCount(config);

	assert.ok(rule, "Rule was created.");

	const parser = new CSVParser(config, rule);
	
	assert.ok(rule, "Rule was created.");
	
	const done = assert.async();
	const data = "Column1\nfoo\nfoo\nfoo";	// 3 data rows. Shouldn't generate an error.
    parser._run( { data: data }).then((result) => {
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            // assert.equal(dataVar, "Column1\nfoo\nfoo\nfoo\n");
            assert.ok(dataVar.trim() == data, "Expected results to match input.");
			
            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });
});
