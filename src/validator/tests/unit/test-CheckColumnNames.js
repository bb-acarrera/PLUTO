/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const CSVParser = require("../../../rules/CSVParser");
const CheckColumnNames = require("../../../rules/CheckColumnNames");
const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");
const MemoryWriterStream = require("../MemoryWriterStream");

QUnit.module("CheckColumnNames");

QUnit.test( "Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"numHeaderRows" : 1
	};

	const rule = new CheckColumnNames(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no errors or warnings");
});


QUnit.test( "Check Valid Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        },
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.WARNING,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);


	const done = assert.async();
	const data = "Column1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors or warnings.");
		done();

	});
});

QUnit.test( "Check Valid 2 column Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.WARNING,
		orderMatch: 'ignore'
	};


	const parser = new CSVParser(config, CheckColumnNames, config);


	const done = assert.async();
	const data = "Column1,Column2\n1234,1234";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors or warnings.");
		done();

	});
});


QUnit.test( "Missing column error", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.WARNING,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect one error.");
		if(logResults.length) {
			assert.equal(logResults[0].type, ErrorHandlerAPI.ERROR, "Expected an 'Error'.");
		}

		done();

	});
});

QUnit.test( "Missing column warning", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2"],
		missingColumns: ErrorHandlerAPI.WARNING,
		extraColumns: ErrorHandlerAPI.WARNING,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect one warning.");
		if(logResults.length) {
			assert.equal(logResults[0].type, ErrorHandlerAPI.WARNING, "Expected a 'Warning'.");
		}

		done();

	});
});

QUnit.test( "Missing column ignore", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2"],
		missingColumns: 'ignore',
		extraColumns: ErrorHandlerAPI.WARNING,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors or warnings");
		done();

	});
});


QUnit.test( "Extra column error", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.ERROR,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1,Column2";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect one error.");
		if(logResults.length) {
			assert.equal(logResults[0].type, ErrorHandlerAPI.ERROR, "Expected an 'Error'.");
		}

		done();

	});
});

QUnit.test( "Extra column warning", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.WARNING,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1,Column2";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect one warning.");
		if(logResults.length) {
			assert.equal(logResults[0].type, ErrorHandlerAPI.WARNING, "Expected a 'Warning'.");
		}

		done();

	});
});

QUnit.test( "Extra column ignore", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: 'ignore',
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1,Column2";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors or warnings");

		done();

	});
});

QUnit.test( "order match error", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2", "Column3"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.ERROR,
		orderMatch: ErrorHandlerAPI.ERROR
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1,Column3,Column2";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect one error.");
		if(logResults.length) {
			assert.equal(logResults[0].type, ErrorHandlerAPI.ERROR, "Expected an 'Error'.");
		}

		done();

	});
});

QUnit.test( "order match warning", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2", "Column3"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.ERROR,
		orderMatch: ErrorHandlerAPI.WARNING
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1,Column3,Column2";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 1, "Expect one warning.");
		if(logResults.length) {
			assert.equal(logResults[0].type, ErrorHandlerAPI.WARNING, "Expected a 'Warning'.");
		}

		done();

	});
});

QUnit.test( "order match ignore", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		},
		"columns" : "1",
		"numHeaderRows" : 1,
		"columnRow": 1,
		"columnNames" : ["Column1", "Column2", "Column3"],
		missingColumns: ErrorHandlerAPI.ERROR,
		extraColumns: ErrorHandlerAPI.ERROR,
		orderMatch: 'ignore'
	};

	const parser = new CSVParser(config, CheckColumnNames, config);

	const done = assert.async();
	const data = "Column1,Column3,Column2";
	parser._run( MemoryWriterStream.getRuleStreamObject(data) ).then((result) => {

		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors or warnings.");


		done();

	});
});

QUnit.module("");