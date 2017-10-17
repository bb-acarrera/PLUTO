const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");

function getDefaultConfig() {
    return {
        "_debugLogger" : new ErrorLogger(),
        "rootDirectory" : "./src",
        "rulesDirectory" : "./validator/tests/testRules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : ".",
        "outputDirectory" : "results"
    };
}

QUnit.test( "Validator Error Handling: No Warnings or Errors", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1
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

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        () => {
            assert.equal(vldtr.abort, false, "Expected run to succeed");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: One Error", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "error"
                    }
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

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, true, "Expected run to fail");
            assert.ok(log.length > 0, "Expected at least one log entry");
            assert.equal(log[0].type, "Error", "Expected an error");
            assert.equal(log[0].description, "Row 2 has error", 'Expected "Row 2 has error"');
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: Abort on two errors, only one error", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "error"
                    }
                }
            }
        ],
        errors : {
            "errorsToAbort": 2
        },
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, false, "Expected run to succeed");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: Abort on two errors, has two error", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "error",
                        "3": "error"
                    }
                }
            }
        ],
        errors : {
            "errorsToAbort": 2
        },
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, true, "Expected run to fail");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: Abort on one warning", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "warning"
                    }
                }
            }
        ],
        errors : {
            "warningsToAbort": 1
        },
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, true, "Expected run to fail");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: Abort on two warnings, have one warning", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "warning"
                    }
                }
            }
        ],
        errors : {
            "warningsToAbort": 2
        },
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, false, "Expected run to succeed");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: Abort on two warning", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "warning",
                        "3": "warning"
                    }
                }
            }
        ],
        errors : {
            "warningsToAbort": 1
        },
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, true, "Expected run to fail");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator Error Handling: Abort on rule errors", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": "error"
                    },
                    "errorsToAbort": 1
                }
            }
        ],
        errors : {
            "errorsToAbort": 2
        },
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, true, "Expected run to fail");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});
