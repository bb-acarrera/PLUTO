/**
 * Created by cgerber on 2017-07-26.
 */

const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");
const Data = require("../../../common/dataDb");

QUnit.test( "Validator: No Config Creation Test", function(assert){

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

QUnit.test( "Validator: Nonexistent RootDirectory Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "/foo/bar"
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

QUnit.test( "Validator: No rulesDirectory Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDirectory" : "./src"
   };

   const vldtr = new validator(config, () => {});
   assert.ok(vldtr.config.rulesDirectory, "rules");

});

QUnit.test( "Validator: End to End Test", function(assert) {
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDirectory" : "./src",
       "rulesDirectory" : "rules",
       "tempDirectory" : "./tmp",
       "inputDirectory" : ".",
       "outputDirectory" : "results"
   }

   const done = assert.async();
   const vldtr = new validator(config, () => {
       return {
           retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
               return new Promise((resolve) => {
                   resolve({
                   });
               })
           },
           createRunRecord: function() {
               return new Promise((resolve) => {
                   resolve(0);
               })
           },
           saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
               return new Promise((resolve) => {
                   assert.ok(log, "Expected log to be created");
                   done();
                   resolve();
               });
           },
           end: function () {}

       };
   });

   vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

   const logResults = logger.getLog();


});

QUnit.test( "Validator: End to End with ruleset Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDirectory" : "./src",
       "rulesDirectory" : "rules",
       "tempDirectory" : "./tmp",
       "inputDirectory" : "",
       "outputDirectory" : "results",
       "ruleset" : "Test Data Ruleset"
   };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve) => {
                    resolve({
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
                    });
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {

                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');


});

QUnit.test( "Validator: End to End no ruleset Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "rules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : "",
        "outputDirectory" : "results",
    };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve) => {
                    resolve({

                    });
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {

                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    assert.equal(log[0].type, "Warning", "Expected a warning");
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End CheckColumnCount Rule Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "rules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : "",
        "outputDirectory" : "results",
        "ruleset" : "Test Data Ruleset"
       };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve) => {
                    resolve({
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
                    });
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    assert.equal(log[0].type, "Error", "Expected an error");
                    assert.equal(log[0].description, "Row 1 has wrong number of columns. Got 9.", 'Expected "Row 1 has wrong number of columns. Got 9."')
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End CheckLatLong Warning Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "rules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : "",
        "outputDirectory" : "results",
        "ruleset" : "Test Data Ruleset"
    };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve) => {
                    resolve({
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
                    });
                    //throw new Exception('this is an exception');
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    assert.equal(log[0].type, "Warning", "Expected an error");
                    assert.equal(log[0].description, "Found null island in row 3.", 'Expected "Found null island in row 3"');
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End Null Promise Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "rules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : "",
        "outputDirectory" : "results",
        "ruleset" : "Test Data Ruleset"
    };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve) => {
                    resolve(null);
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    assert.equal(log[0].type, "Error", "Expected an error");
                    assert.equal(log[0].description, "No Ruleset found for: Test Data Ruleset", 'Expected "No Ruleset found for: Test Data Ruleset"');
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End Throw Error Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "rules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : "",
        "outputDirectory" : "results",
        "ruleset" : "Test Data Ruleset"
    };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve) => {
                    throw "Thrown Error";
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    assert.equal(log[0].type, "Error", "Expected an error");
                    assert.equal(log[0].description, "Thrown Error", 'Expected "Thrown Error"');
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End Promise Rejection Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "rules",
        "tempDirectory" : "./tmp",
        "inputDirectory" : "",
        "outputDirectory" : "results",
        "ruleset" : "Test Data Ruleset"
    };

    const done = assert.async();
    const vldtr = new validator(config, () => {
        return {
            retrieveRuleset: function(ruleset_id, rulesetOverrideFile, version) {
                return new Promise((resolve, reject) => {
                    reject("Rejected Promise");
                })
            },
            createRunRecord: function() {
                return new Promise((resolve) => {
                    resolve(0);
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                return new Promise((resolve) => {
                    assert.ok(log, "Expected log to be created");
                    assert.equal(log[0].type, "Error", "Expected an error");
                    assert.equal(log[0].description, "Rejected Promise", 'Expected "Rejected Promise"');
                    done();
                    resolve();
                });
            },
            end: function () {}

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});
