/*
 * Tests errors and successes of the CheckColumnCount rule.
 */
const ErrorLogger = require("../../ErrorLogger");
const ReZipSingle = require("../../../rules/internal/rezipSingle");

const fs = require("fs");
const fse = require('fs-extra');
const path = require("path");

var AdmZip = require('adm-zip');

QUnit.module("rezipSingle");

QUnit.test( "Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger
		}
	};

	const rule = new ReZipSingle(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no log entries.");
});



QUnit.test( "rezip single file", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp",
			sharedData: {
				unzipSingle: {
					wasUnzipped: true
				}
			}
		}
	};

	const rule = new ReZipSingle(config);

	assert.ok(rule, "Rule was created.");

	// Same as previous test but now with 2 rows.
	const done = assert.async();
	rule._run( { file: './src/validator/tests/testDataCSVFile.csv' }).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");

		assert.ok(fs.existsSync(result.file), 'Expect the file to exist');
		assert.ok(fs.lstatSync(result.file).isFile(), 'Expect the file to be a file');

		let zip = new AdmZip(result.file);
		var zipEntries = zip.getEntries();

		assert.equal(zipEntries.length, 1, 'Expect only one file in zip');

		done();
	});
});


QUnit.test( "rezip non-zip file", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp",
			sharedData: {
				unzipSingle: {}
			}
		}
	};

	const rule = new ReZipSingle(config);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	rule._run( { file: './src/validator/tests/testDataCSVFile.csv' }).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");

		assert.ok(fs.existsSync(result.file), 'Expect the file to exist');
		assert.ok(fs.lstatSync(result.file).isFile(), 'Expect the file to be a file');

		let zipFile = true;

		try {
			let zip = new AdmZip(result.file);
		} catch(e) {
			zipFile = false;
		}

		assert.ok(!zipFile, 'Expect file to be not zipped');

		done();
	});
});

QUnit.test( "rezip multiple files", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp",
			sharedData: {
				unzipSingle: {
					wasUnzipped: true
				}
			}
		}
	};

	const rule = new ReZipSingle(config);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	rule._run( { file: './src/validator/tests/world_borders' }).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no results.");

		assert.ok(fs.existsSync(result.file), 'Expect the file to exist');
		assert.ok(fs.lstatSync(result.file).isFile(), 'Expect the file to be a file');

		let zip = new AdmZip(result.file);
		var zipEntries = zip.getEntries();

		assert.equal(zipEntries.length, 5, 'Expect five files in zip');

		done();
	});
});




QUnit.module("");