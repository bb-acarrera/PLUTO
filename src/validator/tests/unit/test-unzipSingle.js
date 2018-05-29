/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const UnZipSingle = require("../../../rules/internal/unzipSingle");

const fs = require("fs");
const fse = require('fs-extra');
const path = require("path");

QUnit.module("unzipSingle");

QUnit.test( "Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
        __state : {
            "_debugLogger" : logger
        }
	};

	const rule = new UnZipSingle(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no log entries.");
});


// Oddly this test fails on Circle CI but succeeds locally.
// More oddly it fails but Unzip multiple files succeeds. 
QUnit.test( "Unzip single file", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp",
			sharedData: {}
		}
	};

	const rule = new UnZipSingle(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	rule._run( { file: './src/validator/tests/testDataCSVFile.zip' }).then((result) => {
		try {
			const logResults = logger.getLog();
			assert.equal(logResults.length, 0, "Expect no results.");

			assert.ok(fs.existsSync(path.dirname(result.file)), `Expect ${path.dirname(result.file)} to exist`);
			assert.ok(fs.existsSync(result.file), `Expect ${result.file} to exist`);
			assert.ok(fs.lstatSync(result.file).isFile(), 'Expect the file to be a file');
			assert.ok(config.__state.sharedData.unzipSingle.wasUnzipped, 'Expect wasUnzipped to be set to true');
		}
		catch (e) {
			return done(e)
		}
		done();
	});
});


QUnit.test( "Unzip non-zip file", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp",
			sharedData: {}
		}
	};

	const rule = new UnZipSingle(config);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	rule._run( { file: './src/validator/tests/testDataCSVFile.csv' }).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");

		assert.ok(fs.existsSync(result.file), 'Expect the file to exist');
		assert.ok(fs.lstatSync(result.file).isFile(), 'Expect the file to be a file');

		assert.ok(!config.__state.sharedData.unzipSingle.wasUnzipped, 'Expect wasUnzipped to be set to false');

		done();
	});
});

QUnit.test( "Unzip multiple files", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp",
			sharedData: {}
		}
	};

	const rule = new UnZipSingle(config);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	rule._run( { file: './src/validator/tests/world_borders.zip' }).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");

		assert.ok(fs.existsSync(result.file), 'Expect the output to exist');
		assert.ok(fs.lstatSync(result.file).isDirectory(), 'Expect the output to be a directory');
		assert.equal(fs.readdirSync(result.file).length, 5, 'Expect 5 files in directory');

		assert.ok(config.__state.sharedData.unzipSingle.wasUnzipped, 'Expect wasUnzipped to be set to true');

		done();
	});
});




QUnit.module("");