const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");


QUnit.test( "Validator Error Handling: No Warnings or Errors", function(assert) {
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDirectory" : "./src",
       "rulesDirectory" : "rules",
       "tempDirectory" : "./tmp",
       "inputDirectory" : ".",
       "outputDirectory" : "results"
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
                   assert.equal(vldtr.abort, false, "Expected run to succeed");
                   done();
                   resolve();
               });
           },
           end: function () {}

       };
   });

   vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});
