const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");

const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");

function getDefaultConfig() {
    return {
        __state : {
            "_debugLogger" : new ErrorLogger()
        },
        "rootDirectory" : "./src",
        "rulesDirectory" : "./validator/tests/testRules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : ".",
        "outputDirectory" : "results"
    };
}

QUnit.module("Validator Error Handling", () => {

QUnit.test( "No Warnings or Errors", function(assert) {
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


QUnit.test( "One Error", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
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
            if(log.length > 0) {
                assert.equal(log[0].type, "Error", "Expected an error");
                assert.equal(log[0].description, "Row 2 has error", 'Expected "Row 2 has error"');
            }

        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Abort on two errors, only one error", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    }
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 2
        }},
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

QUnit.test( "Abort on two errors, has two error", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR,
                        "3": ErrorHandlerAPI.ERROR
                    }
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 2
        }},
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

QUnit.test( "Abort on one warning", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING
                    }
                }
            }
        ],
        general : { config : {
            "warningsToAbort": 1
        }},
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

QUnit.test( "Abort on two warnings, have one warning", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING
                    }
                }
            }
        ],
        general : { config : {
            "warningsToAbort": 2
        }},
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

QUnit.test( "Abort on two warnings", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING,
                        "3": ErrorHandlerAPI.WARNING
                    }
                }
            }
        ],
        general : { config : {
            "warningsToAbort": 2
        }},
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

            assert.ok(vldtr.logger.getCount(ErrorHandlerAPI.WARNING) == 2, "Expected at 2 warnings");
            assert.ok(vldtr.logger.getCount(ErrorHandlerAPI.ERROR) == 1, "Expected one errors (abort)");

        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Abort on rule errors", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    "errorsToAbort": 1
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 2
        }},
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

QUnit.test( "Pass rule errors, Abort on errors", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    "errorsToAbort": 2
                }
            },
            {
                filename : "RulePassFail",
                config : {
                    id : 2,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    "errorsToAbort": 2
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 2
        }},
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

            assert.ok(vldtr.logger.getCount(ErrorHandlerAPI.ERROR) == 3, "Expected three errors");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Pass rule errors, Pass on errors", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    "errorsToAbort": 2
                }
            },
            {
                filename : "RulePassFail",
                config : {
                    id : 2,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    "errorsToAbort": 2
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 3
        }},
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
            assert.equal(vldtr.abort, false, "Expected run to pass");

            assert.ok(vldtr.logger.getCount(ErrorHandlerAPI.ERROR) == 2, "Expected two errors");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Pass rule warnings, Pass on warnings", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING
                    },
                    "warningsToAbort": 2
                }
            },
            {
                filename : "RulePassFail",
                config : {
                    id : 2,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING
                    },
                    "warningsToAbort": 2
                }
            }
        ],
        general : { config : {
            "warningsToAbort": 3
        }},
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
            assert.equal(vldtr.abort, false, "Expected run to pass");

            assert.ok(vldtr.logger.getCount(ErrorHandlerAPI.WARNING) == 2, "Expected two warnings");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Pass rule warnings, abort on warnings", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING
                    },
                    "warningsToAbort": 2
                }
            },
            {
                filename : "RulePassFail",
                config : {
                    id : 2,
                    rows: {
                        "2": ErrorHandlerAPI.WARNING
                    },
                    "warningsToAbort": 2
                }
            }
        ],
        general : { config : {
            "warningsToAbort": 2
        }},
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

            assert.ok(vldtr.logger.getCount(ErrorHandlerAPI.WARNING) == 2, "Expected two warnings");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Exclude row shouldn't abort", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    onError: 'excludeRow'
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 1
        }},
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
            assert.equal(vldtr.abort, false, "Expected run to pass");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

    QUnit.test( "Exclude row abort on 1 global", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow'
                    }
                }
            ],
            general : { config : {
                "errorsToAbort": 1,
                droppedToAbort: 1
            }},
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

    QUnit.test( "Exclude row abort on 2 global has 1", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow'
                    }
                }
            ],
            general : { config : {
                "errorsToAbort": 1,
                droppedToAbort: 2
            }},
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
                assert.equal(vldtr.abort, false, "Expected run to pass");
            },
            done);


        const vldtr = new validator(config, dbProxy.getDataObj());

        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });

    QUnit.test( "Exclude row abort on 1 on rule", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow',
                        droppedToAbort: 1
                    }
                }
            ],
            general : { config : {
                "errorsToAbort": 1
            }},
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

    QUnit.test( "Exclude row abort on 2 on rule has 1", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow',
                        droppedToAbort: 2
                    }
                }
            ],
            general : { config : {
                "errorsToAbort": 1
            }},
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
                assert.equal(vldtr.abort, false, "Expected run to pass");
            },
            done);


        const vldtr = new validator(config, dbProxy.getDataObj());

        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });

QUnit.test( "Exclude row actually removed", function(assert) {
    const config = getDefaultConfig();

    const done = assert.async();

    const checkFile = () => {
        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RuleCountRows",
                    config : {
                        id : 1,
                        rowCount: 3
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
                assert.equal(vldtr.abort, false, "Expected no errors on rowcount check");
            },
            done);


        const vldtr = new validator(config, dbProxy.getDataObj());

        vldtr.runRuleset("src/results/excludeRow.csv", "output.csv", 'UTF8');
    };

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    onError: 'excludeRow'
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 1
        }},
        parser: {
            filename: "CSVParser",
            config: {
                numHeaderRows : 1
            }
        }
    };



    const dbProxy = new DataProxy(ruleset,
        (runId, log, ruleSetID, inputFile, outputFile) => {
            assert.equal(vldtr.abort, false, "Expected initial run to pass");
        }, checkFile);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "excludeRow.csv", 'UTF8');




});

QUnit.test( "Exclude row following row warning correct id", function(assert) {
    const config = getDefaultConfig();

    const ruleset = {
        name : "Test Data Ruleset",
        rules : [
            {
                filename : "RulePassFail",
                config : {
                    id : 1,
                    rows: {
                        "2": ErrorHandlerAPI.ERROR
                    },
                    onError: 'excludeRow'
                }
            },
            {
                filename : "RuleErrorFromColumn",
                config : {
                    id : 1,
                    column: 9
                }
            }
        ],
        general : { config : {
            "errorsToAbort": 1
        }},
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
            assert.equal(vldtr.abort, false, "Expected run to pass");

            assert.equal(vldtr.logger.getCount(ErrorHandlerAPI.WARNING), 1, "Expected one warning");
            assert.equal(vldtr.logger.getCount(ErrorHandlerAPI.DROPPED), 1, "Expected one dropped");
            assert.equal(log[1].description, 'Row 3 has warning');
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile2.csv", "output2.csv", 'UTF8');

});




    QUnit.test( "Exclude row correct summary count", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow'
                    }
                }
            ],
            general : { config : {
                "errorsToAbort": 1
            }},
            parser: {
                filename: "CSVParser",
                config: {
                    numHeaderRows : 1
                }
            }
        };

        const done = assert.async();

        let vldtr = null;

        const dbProxy = new DataProxy(ruleset,
            (runId, log, ruleSetID, inputFile, outputFile, logCounts, passed, summary) => {
                assert.equal(vldtr.abort, false, "Expected run to pass");

                assert.equal(summary.processeditems, 4, '4 rows processed');
                assert.equal(summary.outputitems, 3, '3 rows output');
            },
            done);

        vldtr = new validator(config, dbProxy.getDataObj());


        vldtr.runRuleset("src/validator/tests/testDataCSVFile2.csv", "output2.csv", 'UTF8');

    });


    QUnit.test( "Exclude 25% rows abort on 20%", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow'
                    }
                }
            ],
            general : { config : {
                droppedPctToAbort: 20
            }},
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

    QUnit.test( "Exclude 25% rows abort on 50%", function(assert) {
        const config = getDefaultConfig();

        const ruleset = {
            name : "Test Data Ruleset",
            rules : [
                {
                    filename : "RulePassFail",
                    config : {
                        id : 1,
                        rows: {
                            "2": ErrorHandlerAPI.ERROR
                        },
                        onError: 'excludeRow'
                    }
                }
            ],
            general : { config : {
                droppedPctToAbort: 50
            }},
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
                assert.equal(vldtr.abort, false, "Expected run to pass");
            },
            done);


        const vldtr = new validator(config, dbProxy.getDataObj());

        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });

});