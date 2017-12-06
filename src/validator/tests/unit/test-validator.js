/**
 * Created by cgerber on 2017-07-26.
 */

const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");

QUnit.module("Validator", () => {



QUnit.test( " No Config Creation Test", function(assert){

    assert.throws(
        function() {
            const vldtr = new validator();
        },
        function( err ) {
            return err.toString().startsWith("No data accessor supplied");
        },
        'Expected "No data accessor supplied"'
    );

});

QUnit.test( " Nonexistent RootDirectory Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "rootDirectory" : "/foo/bar"
        }
    };

    assert.throws(
        function() {
            const vldtr = new validator(config);
        },
        function( err ) {
            return err.toString().startsWith("Failed to find RootDirectory ");
        },
        'Expected "Failed to find RootDirectory"'
    );

});

QUnit.test( " No rulesDirectory Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "rootDirectory" : "./src"
        }
    };

    const vldtr = new validator(config, () => {});
    assert.ok(vldtr.config.rulesDirectory, "rules");

});

QUnit.test( " End to End Test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "rootDirectory" : "./src",
            "tempDirectory" : "./tmp"
        },
        "rulesDirectory" : "rules",
        "inputDirectory" : ".",
        "outputDirectory" : "results"
    };

    const done = assert.async();

    const ruleset = {};

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    const logResults = logger.getLog();


});

QUnit.test( " End to End with ruleset Test", function(assert){
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
                    columns : 9,
                    numHeaderRows : 1
                }
            }
        ],
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');


});

QUnit.test( " End to End no ruleset Test", function(assert){
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
    };

    const done = assert.async();

    const ruleset = {};

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log[0].type, "Warning", "Expected a warning");
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

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
                    columns : 4
                }
            }
        ],
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log[0].type, "Warning", "Expected a warning");
            assert.equal(log[0].description, "Row 1 has too many columns. Got 9.", 'Expected "Row 1 has too many columns. Got 9."');
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( " End to End CheckLatLong Warning Test", function(assert){
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
                filename : "CheckLatLong",
                config : {
                    numHeaderRows : 1,
                    latitudeColumn : 2,
                    longitudeColumn : 3,
                    nullEpsilon : 0
                }
            }
        ],
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log[0].type, "Warning", "Expected a warning");
            assert.equal(log[0].description, "Found null island in row 3.", 'Expected "Found null island in row 3"');
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( " End to End Null Promise Test", function(assert){
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

    const ruleset = (resolve) => { resolve(null) };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log[0].type, "Error", "Expected an error");
            assert.equal(log[0].description, "No Ruleset found for: Test Data Ruleset", 'Expected "No Ruleset found for: Test Data Ruleset"');
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( " End to End Throw Error Test", function(assert){
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

    const ruleset = () => { throw "Thrown Error" };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log[0].type, "Error", "Expected an error");
            assert.equal(log[0].description, "Thrown Error", 'Expected "Thrown Error"');
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( " End to End Promise Rejection Test", function(assert){
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

    const ruleset = (resolve, reject) => {
        reject("Rejected Promise");
    };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log[0].type, "Error", "Expected an error");
            assert.equal(log[0].description, "Rejected Promise", 'Expected "Rejected Promise"');
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( " End to End add column, delete column, and test length", function(assert){
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
                    columns : 9
                }
            },
            {
                filename : "AddRegExColumn",
                config : {
                    id : 2,
                    column : 'city',
                    newColumn: 'new column',
                    regex: '[\\s\\S]*'
                }
            },
            {
                filename : "CheckColumnCount",
                config : {
                    id : 3,
                    columns : 10
                }
            },
            {
                filename : "DeleteColumn",
                config : {
                    id : 4,
                    column : 'new column'
                }
            },
            {
                filename : "CheckColumnCount",
                config : {
                    id : 1,
                    columns : 9
                }
            }
        ],
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1,
                columnNames: ['city','city_ascii','lat','lng','pop','country','iso2','iso3','province']
            }
        }
    };

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.ok(log, "Expected log to be created");
            assert.equal(log.length, 0, "Expected no log entries, had some");
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

});
