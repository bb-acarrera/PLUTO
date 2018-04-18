/**
 * Created by cgerber on 2017-07-26.
 */

const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");

const path = require("path");

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

QUnit.module("Validator",
    {
        before: function() {

            let apiPath = path.resolve(process.cwd(), "src/api");

            if (!process.env.PLUTOAPI)
                process.env['PLUTOAPI'] = apiPath;

            if(!process.env.PYTHONPATH || !process.env.PYTHONPATH.includes(apiPath))
                process.env['PYTHONPATH'] = (process.env['PYTHONPATH'] || '') + ':' + apiPath;
        }
    }, () => {



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
            assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
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
            assert.ok(vldtr.abort, "Expected validator to abort");
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
            assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
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
            assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
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
            assert.ok(vldtr.abort, "Expected validator to abort");
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
            assert.ok(vldtr.abort, "Expected validator to abort");
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
            assert.ok(vldtr.abort, "Expected validator to abort");
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
        //"rulesDirectory" : "rules",
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
            assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
        },
        done);

    const vldtr = new validator(config, dbProxy.getDataObj());


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

    QUnit.test( " Skip same file test", function(assert){
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
            "ruleset" : "Test Data Ruleset",
            doMd5HashCheck: true
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
                assert.ok(vldtr.skipped, "Expected validator to skip.");
            },
            done, {
                getRuns: (page, size, filters) => {
                    if(!filters.inputMd5Filter) {
                        return null;
                    }

                    return {
                        rowCount: 1,
                        pageCount: 1,
                        runs: [
                            {
                                id: 0,
                                log: 0,
                                ruleset: "",
                                inputfilename: "",
                                outputfilename: "",
                                time: new Date(),
                                starttime: new Date(),
                                errorcount: 0,
                                warningcount: 0,
                                droppedcount: 0,
                                isrunning: false,
                                passed: true,
                                summary: {},
                                version: 0,
                                deleted: false,
                                group: null,
                                sourceid: 0,
                                sourcefile: "",
                                inputmd5: filters.inputMd5Filter
                            }
                        ]
                    }
                }
            });

        const vldtr = new validator(config, dbProxy.getDataObj());


        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });


    QUnit.test( " Wait for other run", function(assert){
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
            "ruleset" : "Test Data Ruleset",
            runPollingInterval: 0.5
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
                }
            ],
            parser: {
                filename: "CSVParser",
                config: {
                    numHeaderRows : 1
                }
            }
        };

        const waitingRun = {
            id: 1001,
            log: 1001,
            ruleset: "",
            inputfilename: "",
            outputfilename: "",
            time: new Date(),
            starttime: new Date(),
            errorcount: 0,
            warningcount: 0,
            droppedcount: 0,
            isrunning: false,
            passed: true,
            summary: {},
            version: 0,
            deleted: false,
            group: null,
            sourceid: 0,
            sourcefile: "",
            inputmd5: ""
        };

        let checkCount = 0;

        const dbProxy = new DataProxy(ruleset,
            (runId, log, ruleSetID, inputFile, outputFile) => {
                assert.equal(checkCount, 2, "Expected 2 checks for the other run");
                assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
            },
            done, {
                getRuns: (page, size, filters) => {
                    if(filters.idLessThanFilter == null) {
                        return null;
                    }

                    checkCount += 1;

                    if(checkCount < 2) {
                        return {
                            rowCount: 1,
                            pageCount: 1,
                            runs: [
                                waitingRun
                            ]
                        }
                    } else {
                        return null;
                    }



                }
            });

        const vldtr = new validator(config, dbProxy.getDataObj());


        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });

    QUnit.test( " Clean up old run first", function(assert){
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
            "ruleset" : "Test Data Ruleset",
            runPollingInterval: 0.5,
            runMaximumDuration: 1
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
                }
            ],
            parser: {
                filename: "CSVParser",
                config: {
                    numHeaderRows : 1
                }
            }
        };

        //create time 27 seconds before now
        const time = new Date(new Date().getTime() - 27*1000);

        const waitingRun = {
            id: 1001,
            log: 1001,
            ruleset: "",
            inputfilename: "",
            outputfilename: "",
            time: time,
            starttime: time,
            errorcount: 0,
            warningcount: 0,
            droppedcount: 0,
            isrunning: true,
            passed: true,
            summary: {},
            version: 0,
            deleted: false,
            group: null,
            sourceid: 0,
            sourcefile: "",
            inputmd5: ""
        };

        let checkCount = 0;
        let updatedOldRun = false;

        const dbProxy = new DataProxy(ruleset,
            (runId, log, ruleSetID, inputFile, outputFile) => {
                assert.ok(checkCount > 1, "Expected at least 1 check for the other run");
                assert.ok(updatedOldRun, "Expected validator to update the bad run");
                assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
            },
            done, {
                getRuns: (page, size, filters) => {
                    if(updatedOldRun || filters.idLessThanFilter == null) {
                        return null;
                    }

                    checkCount += 1;

                    return {
                        rowCount: 1,
                        pageCount: 1,
                        runs: [
                            waitingRun
                        ]
                    }


                },
                saveRunRecord: (runId) => {
                    if(runId != waitingRun.id) {
                        return false;
                    }

                    updatedOldRun = true;

                    return true;
                }
            });

        const vldtr = new validator(config, dbProxy.getDataObj());


        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });

    QUnit.test( " End to End Validation skip Test", function(assert){
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
            dovalidate: false, //This will skip test part of the validation.
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
                assert.equal(log.length, 0, "Expected no warnings or errors");
                assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
            },
            done);

        const vldtr = new validator(config, dbProxy.getDataObj());


        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });

    QUnit.test( " End to End Validation skip Test No Parser", function(assert){
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
            dovalidate: false, //This will skip test part of the validation.
        };

        const dbProxy = new DataProxy(ruleset,
            (runId, log, ruleSetID, inputFile, outputFile) => {
                assert.ok(log, "Expected log to be created");
                assert.equal(log.length, 0, "Expected no warnings or errors");
                assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
            },
            done);

        const vldtr = new validator(config, dbProxy.getDataObj());


        vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

    });


        QUnit.test( "internal rowId column actually removed", function(assert) {
            const config = getDefaultConfig();

            const done = assert.async();

            const checkFile = () => {
                const ruleset = {
                    name : "Test Data Ruleset",
                    rules : [
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
                            numHeaderRows : 1
                        }
                    }
                };

                const dbProxy = new DataProxy(ruleset,
                    (runId, log, ruleSetID, inputFile, outputFile) => {
                        assert.equal(vldtr.abort, false, "Expected no errors on column count check");
                        assert.equal(log.length, 0, "Expected no warnings or errors");

                    },
                    done);


                const vldtr = new validator(config, dbProxy.getDataObj());

                vldtr.runRuleset("src/results/excludeRow.csv", "output.csv", 'UTF8');
            };

            const ruleset = {
                name : "Test Data Ruleset",
                rules : [
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

        QUnit.test( "change state test", function(assert){
            const config = getDefaultConfig();

            const done = assert.async();

            const ruleset = {
                name : "Test Data Ruleset",
                rules : [
                    {
                        filename : "unzip",
                        config : {
                            id : 1
                        }
                    },
                    {
                        filename : "CheckColumnCount",
                        config : {
                            id : 2,
                            columns : 9
                        }
                    },
                    {
                        filename : "zip",
                        config : {
                            id : 3
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
                    assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");

                },
                done);

            const vldtr = new validator(config, dbProxy.getDataObj());


            vldtr.runRuleset("src/validator/tests/testDataCSVFile.zip", "output.zip", 'UTF8');

        });


        QUnit.test( "internal rowId column added and removed on state change", function(assert) {
            const config = getDefaultConfig();

            const done = assert.async();

            const checkOutputFile = () => {
                const ruleset = {
                    name : "Test Data Ruleset",
                    rules : [
                        {
                            filename : "unzip",
                            config : {
                                id : 1
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
                            numHeaderRows : 1
                        }
                    }
                };

                const dbProxy = new DataProxy(ruleset,
                    (runId, log, ruleSetID, inputFile, outputFile) => {
                        assert.equal(vldtr.abort, false, "Expected no errors on column count check");
                        assert.equal(log.length, 0, "Expected no warnings or errors");

                    },
                    done);


                const vldtr = new validator(config, dbProxy.getDataObj());

                vldtr.runRuleset("src/results/excludeRow.zip", "output.csv", 'UTF8');
            };

            const checkIntermediateFile = () => {
                const ruleset = {
                    name : "Test Data Ruleset",
                    rules : [
                        {
                            filename : "CheckColumnCount",
                            config : {
                                id : 1,
                                columns : 10
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
                        assert.equal(vldtr.abort, false, "Expected no errors on column count check");
                        assert.equal(log.length, 0, "Expected no warnings or errors");
                    },
                    checkOutputFile);


                const vldtr = new validator(config, dbProxy.getDataObj());

                vldtr.runRuleset("src/results/temp.csv", "output.csv", 'UTF8');
            };

            const ruleset = {
                name : "Test Data Ruleset",
                rules : [
                    {
                        filename : "unzip",
                        config : {
                            id : 1
                        }
                    },
                    {
                        filename : "CheckColumnCount",
                        config : {
                            id : 2,
                            columns : 9
                        }
                    },
                    {
                        filename : "noOp",
                        config : {
                            id : 8
                        }
                    },
                    {
                        filename : "copyCurrentCSV",
                        config : {
                            id : 4,
                            target : "src/results/temp.csv"
                        }
                    },
                    {
                        filename : "zip",
                        config : {
                            id : 3
                        }
                    },
                    {
                        filename : "unzip",
                        config : {
                            id : 5
                        }
                    },
                    {
                        filename : "CheckColumnCount",
                        config : {
                            id : 6,
                            columns : 9
                        }
                    },
                    {
                        filename : "zip",
                        config : {
                            id : 7
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
                    assert.equal(vldtr.abort, false, "Expected initial run to pass");

                }, checkIntermediateFile);


            const vldtr = new validator(config, dbProxy.getDataObj());

            vldtr.runRuleset("src/validator/tests/testDataCSVFile.zip", "excludeRow.zip", 'UTF8');




        });


        QUnit.test( " Required Rule Test", function(assert){
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
                "ruleset" : "Test Data Ruleset",
                "requiredRules": [{
                    "parser" : "CSVParser",
                    "rules" : [
                    {
                        "config": {
                            columns : 9
                        },
                        "filename": "CheckColumnCount"
                    }
                ]}]
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
                    assert.ok(!vldtr.abort, "Expected validator to succeed without aborting");
                },
                done);

            const vldtr = new validator(config, dbProxy.getDataObj());


            vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

        });

        QUnit.test( " Required Rule Test no rule", function(assert){
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
                "ruleset" : "Test Data Ruleset",
                "requiredRules": [{
                    "parser" : "CSVParser",
                    "rules" : [
                        {
                            "config": {
                                columns : 9
                            },
                            "filename": "CheckColumnCount"
                        }
                    ]}]
            };

            const done = assert.async();

            const ruleset = {
                name : "Test Data Ruleset",
                rules : [
                    {
                        filename : "noOp",
                        config : {
                            id : 8
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
                    assert.ok(vldtr.abort, "Expected validator to fail");
                },
                done);

            const vldtr = new validator(config, dbProxy.getDataObj());


            vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

        });

        QUnit.test( " Required Rule Test wrong rule config", function(assert){
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
                "ruleset" : "Test Data Ruleset",
                "requiredRules": [{
                    "parser" : "CSVParser",
                    "rules" : [
                        {
                            "config": {
                                columns : 9
                            },
                            "filename": "CheckColumnCount"
                        }
                    ]}]
            };

            const done = assert.async();

            const ruleset = {
                name : "Test Data Ruleset",
                rules : [
                    {
                        filename : "CheckColumnCount",
                        config : {
                            id : 1,
                            columns : 8
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
                    assert.ok(vldtr.abort, "Expected validator to fail");
                },
                done);

            const vldtr = new validator(config, dbProxy.getDataObj());


            vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

        });

});
