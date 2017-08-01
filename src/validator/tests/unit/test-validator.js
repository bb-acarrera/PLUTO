/**
 * Created by cgerber on 2017-07-26.
 */

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../api/RuleAPI");
const validator = require("../../../validator/validator");
const Data = require("../../../common/dataDb");

QUnit.test( "Validator: No Config Creation Test", function(assert){
    const logger = new ErrorLogger();

    assert.throws(
        function() {
            const vldtr = new validator();
        },
        function( err ) {
            return err.toString().startsWith("Failed to find RulesetDirectory ");
        },
        'Expected "Failed to find RulesetDirectory"'
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
           return err.toString().startsWith("Failed to find RootDirectory")
       },
       'Expected "Failed to find RootDirectory"'
   );
});


QUnit.test( "Validator: No rulesetDirectory Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src"
    };

    const vldtr = new validator(config, () => {});
    assert.ok(vldtr.config.rulesetDirectory, "runtime/rulesets");

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

QUnit.test( "Validator: Nonexistent rulesetDirectory Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesetDirectory" : "foo/bar"
    };

    assert.throws(
        function() {
            const vldtr = new validator(config);
        },
        function( err ) {
            return err.toString().startsWith("Failed to find RulesetDirectory")
        },
        'Expected "Failed to find RootDirectory"'
    );
});

QUnit.test( "Validator: Nonexistent rulesDirectory Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "foo/bar"
    };

    assert.throws(
        function() {
            const vldtr = new validator(config);
        },
        function( err ) {
            return err.toString().startsWith("Failed to find RulesDirectory")
        },
        'Expected "Failed to find RulesDirectory"'
    );
});

QUnit.test( "Validator: End to End Test", function(assert) {
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDirectory" : "./src",
       "rulesDirectory" : "runtime/rules",
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
           saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
               assert.ok(log, "Expected log to be created");
               done();
           }

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
       "rulesDirectory" : "runtime/rules",
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
                                        columns : 9
                                    }
                                }
                            ]
                    });
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                done();
            }

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');


});

QUnit.test( "Validator: End to End no ruleset Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "runtime/rules",
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
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                assert.equal(log[0].type, "Warning", "Expected a warning");
                done();
            }

        };
    });

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End CheckColumnCount Rule Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "runtime/rules",
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
                        ]
                    });
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                assert.equal(log[0].type, "Error", "Expected an error");
                assert.equal(log[0].description, "Row 0 has wrong number of columns. Got 9.", 'Expected "Row 0 has wrong number of columns. Got 9."')
                done();
            }

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End CheckLatLong Warning Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "runtime/rules",
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
                                    numberOfHeaderRows : 1,
                                    latitudeColumn : 2,
                                    longitudeColumn : 3,
                                    nullIslandEpsilon : 0
                                }
                            }
                        ]
                    });
                    //throw new Exception('this is an exception');
                })
            },
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                assert.equal(log[0].type, "Warning", "Expected an error");
                assert.equal(log[0].description, "Found null island in row 2.", 'Expected "Found null island in row 2"');
                done();
            }

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End Null Promise Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "runtime/rules",
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
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                assert.equal(log[0].type, "Error", "Expected an error");
                assert.equal(log[0].description, "No Ruleset found for: Test Data Ruleset", 'Expected "No Ruleset found for: Test Data Ruleset"');
                done();
            }

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End Throw Error Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "runtime/rules",
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
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                assert.equal(log[0].type, "Error", "Expected an error");
                assert.equal(log[0].description, "Thrown Error", 'Expected "Thrown Error"');
                done();
            }

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});

QUnit.test( "Validator: End to End Promise Rejection Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rootDirectory" : "./src",
        "rulesDirectory" : "runtime/rules",
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
            saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                assert.ok(log, "Expected log to be created");
                assert.equal(log[0].type, "Error", "Expected an error");
                assert.equal(log[0].description, "Rejected Promise", 'Expected "Rejected Promise"');
                done();
            }

        };
    });


    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});
