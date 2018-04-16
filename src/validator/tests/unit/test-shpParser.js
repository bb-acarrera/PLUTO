const gdal = require('gdal');

const ErrorLogger = require("../../ErrorLogger");
const ShpParser = require("../../../rules/shpParser");
const TableRuleAPI = require("../../../api/TableRuleAPI");
const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");

const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");

class TestTableRule extends TableRuleAPI {
	constructor(config) {
		super(config);

	}

	start(parser) {
		this.parser = parser;
		this.rowCount = 0;

		if(this.config.startFn) {
			this.config.startFn();
			return;
		}

		if(this.config.removeColumn != null) {
			this.parser.removeColumn(this.config.removeColumn);
		}

		if(this.config.addColumn) {
			this.parser.addColumn(this.config.addColumn);
			this.addedColumnIndex = this.getValidatedColumnProperty(this.config.addColumn);
		}

		if(this.config.modifyColumn) {
			this.modifyColumnIndex = this.getValidatedColumnProperty(this.config.modifyColumn);
		}


	}

	processRecord(record, rowId, isHeader) {
		this.rowCount++;

		if(this.config.processRecordFn) {
			return this.config.processRecordFn(record, rowId, isHeader);
		}

		if(!isHeader && this.config.addColumn) {
			record[this.addedColumnIndex] = this.config.addColumn;
		}

		if(!isHeader && this.config.modifyColumn) {
			record[this.modifyColumnIndex] = this.config.modifyColumnValue;
		}

		if(this.config.async) {

			return new Promise((resolve) => {

				setTimeout(() =>{
					resolve(record);
				}, 100);


			});
		}

		return record;
	}

	finish() {
		this.finished = true;

		if(this.config.finishFn) {
			this.config.finishFn();
			return;
		}
	}

	get processHeaderRows() {

		if(this.config.processHeaderRows != null) {
			return this.config.processHeaderRows;
		}

		return true;
	}
}

QUnit.module("shpParser");

QUnit.test( "Creation Test", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1
	};

	const rule = new ShpParser(config, new TestTableRule());

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 0, "Expect no errors or warnings");
});

QUnit.test( "Creation Test No Rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger
	        },
		"numHeaderRows" : 1
	};

	const rule = new ShpParser(config);

	// Check general rule creation and as well as absent "Columns" property.
	assert.ok(rule, "Rule was created.");

	const logResults = logger.getLog();
	assert.equal(logResults.length, 1, "Expect single result.");
	assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
});

QUnit.test( "valid shapefile", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
	        __state : {
	            "_debugLogger" : logger,
		        tempDirectory: "./tmp"
	        }
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');
		done();
	});
});

QUnit.test( "async rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		},
		async: true
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');
		done();
	});
});

QUnit.test( "modify column rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		},
		modifyColumn: 'NAME',
		modifyColumnValue: 'new name'
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');

		let ds = gdal.open(result.file);
		let layer = ds.layers.get(0);

		assert.equal(layer.features.get(0).fields.get(4), config.modifyColumnValue, 'Expect column value to match at index');
		assert.equal(layer.features.get(12).fields.get(4), config.modifyColumnValue, 'Expect column value to match at index');

		done();
	});
});

QUnit.test( "drop column rule", function( assert ) {
	const logger = new ErrorLogger();

	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		},
		processRecordFn: (record, rowId, isHeader) => {
			if(rule.rowCount > 1) {
				return null;
			}
			return record;
		},
		processHeaderRows: false

	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);

		let ds = gdal.open(result.file);
		let layer = ds.layers.get(0);

		let count = 0;
		layer.features.forEach((feature) => {
			count++;
		});
		assert.equal(count, 1, 'Expect one feature');

		done();
	});
});

QUnit.test( "add column rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		},
		addColumn: 'newColumn'
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');

		let ds = gdal.open(result.file);
		let layer = ds.layers.get(0);
		assert.equal(layer.fields.count(), 12, 'Expect 12 columns');
		assert.equal(layer.fields.get(11).name, config.addColumn, 'Expect column name to match at index');

		assert.equal(layer.features.get(0).fields.get(11), config.addColumn, 'Expect column value to match at index');

		done();
	});
});

QUnit.test( "remove column rule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		},
		removeColumn: 0
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders' } ).then((result) => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');

		let ds = gdal.open(result.file);
		let layer = ds.layers.get(0);
		assert.equal(layer.fields.count(), 10, 'Expect 10 columns');
		assert.equal(layer.fields.get(0).name, 'ISO2', 'Expect first column name to be ISO2');


		done();
	});
});

QUnit.test( "no attributes with TableRule", function( assert ) {
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			tempDirectory: "./tmp"
		}
	};

	const rule = new TestTableRule(config);

	const parser = new ShpParser(config, rule);

	assert.ok(rule, "Rule was created.");

	const done = assert.async();
	parser._run( { file: './src/validator/tests/world_borders_min' } ).then(() => {
		const logResults = logger.getLog();
		assert.equal(logResults.length, 0, "Expect no errors.");
		assert.ok(rule.finished);
		assert.equal(rule.rowCount, 247, 'Expect 247 entries');
		done();
	});
});

/////////////////////////////////////////////////////////
// integration test
QUnit.test( " End to End CheckColumnCount Rule Test", function(assert){
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			"rootDirectory" : "./src",
			"tempDirectory" : "./tmp"
		},
		"rulesDirectory" : "rules",
		"inputDirectory" : "",
		"outputDirectory" : "results",
		"ruleset" : "Test Data Ruleset"
	};

	const done = assert.async();

	const ruleset = {
		name : "Test Data Ruleset",
		rules : [
			{
				filename : "CheckColumnCount",
				config : {
					id : 1,
					columns : 11
				}
			}
		],
		parser: {
			filename: "shpParser",
			config: {
			}
		}
	};

	const dbProxy = new DataProxy(ruleset,
		(runId, log, ruleSetID, inputFile, outputFile) => {
			assert.ok(log, "Expected log to be created");
			assert.equal(log.length, 0, "Expected no log entries");
			assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
		},
		done);

	const vldtr = new validator(config, dbProxy.getDataObj());


	vldtr.runRuleset("src/validator/tests/world_borders.zip", "output_borders.zip", 'UTF8');

});

QUnit.test( " End to End CheckColumnCount Rule Test Failure", function(assert){
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			"rootDirectory" : "./src",
			"tempDirectory" : "./tmp"
		},
		"rulesDirectory" : "rules",
		"inputDirectory" : "",
		"outputDirectory" : "results",
		"ruleset" : "Test Data Ruleset"
	};

	const done = assert.async();

	const ruleset = {
		name : "Test Data Ruleset",
		rules : [
			{
				filename : "CheckColumnCount",
				config : {
					id : 1,
					columns : 12

				}
			}
		],
		parser: {
			filename: "shpParser",
			config: {
			}
		}
	};

	const dbProxy = new DataProxy(ruleset,
		(runId, log, ruleSetID, inputFile, outputFile) => {
			assert.ok(log, "Expected log to be created");
			assert.ok(vldtr.abort, "Expected validator to succeed without aborting");
		},
		done);

	const vldtr = new validator(config, dbProxy.getDataObj());


	vldtr.runRuleset("src/validator/tests/world_borders.zip", "output.zip", 'UTF8');

});

//"columnNames" : ["Column1"],
//missingColumns: ErrorHandlerAPI.ERROR,
//	extraColumns: ErrorHandlerAPI.WARNING,
//	orderMatch: 'ignore'

// ["FIPS","ISO2","ISO3","UN","NAME","AREA","POP2005","REGION","SUBREGION","LON","LAT"]

QUnit.test( " End to End CheckColumnNames Rule Test No Attributes", function(assert){
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			"rootDirectory" : "./src",
			"tempDirectory" : "./tmp"
		},
		"rulesDirectory" : "rules",
		"inputDirectory" : "",
		"outputDirectory" : "results",
		"ruleset" : "Test Data Ruleset"
	};

	const done = assert.async();

	const ruleset = {
		name : "Test Data Ruleset",
		rules : [
			{
				filename : "CheckColumnNames",
				config : {
					id : 1,
					missingColumns: ErrorHandlerAPI.ERROR,
					extraColumns: ErrorHandlerAPI.WARNING,
					orderMatch: 'ignore'

				}
			}
		],
		parser: {
			filename: "shpParser",
			config: {
				columnNames: ["FIPS","ISO2","ISO3","UN","NAME","AREA","POP2005","REGION","SUBREGION","LON","LAT"]
			}
		}
	};

	const dbProxy = new DataProxy(ruleset,
		(runId, log, ruleSetID, inputFile, outputFile) => {
			assert.ok(log, "Expected log to be created");
			assert.ok(vldtr.abort, "Expected validator to succeed without aborting");
		},
		done);

	const vldtr = new validator(config, dbProxy.getDataObj());


	vldtr.runRuleset("src/validator/tests/world_borders_min.zip", "output_min.zip", 'UTF8');

});


QUnit.test( " End to End multiple shp parser test", function(assert){
	const logger = new ErrorLogger();
	const config = {
		__state : {
			"_debugLogger" : logger,
			"rootDirectory" : "./src",
			"tempDirectory" : "./tmp"
		},
		"rulesDirectory" : "./validator/tests/testRules",
		"inputDirectory" : "",
		"outputDirectory" : "results",
		"ruleset" : "Test Data Ruleset"
	};

	const done = assert.async();

	const ruleset = {
		name : "Test Data Ruleset",
		rules : [
			{
				filename : "CheckColumnCount",
				config : {
					id : 1,
					columns : 11
				}
			},
			{
				filename : "noOp_shp",
				config : {
					id : 2
				}
			}
		],
		parser: {
			filename: "shpParser",
			config: {
			}
		}
	};

	const dbProxy = new DataProxy(ruleset,
		(runId, log, ruleSetID, inputFile, outputFile) => {
			assert.ok(log, "Expected log to be created");
			assert.equal(log.length, 0, "Expected no log entries");

			if(log.length > 0) {
				log.forEach((entry) => {
					console.log(entry.description)
				})
			}

			assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
		},
		done);

	const vldtr = new validator(config, dbProxy.getDataObj());


	vldtr.runRuleset("src/validator/tests/world_borders.zip", "output_borders.zip", 'UTF8');

});


QUnit.module("");