/**
 * Created by cgerber on 2017-07-20.
 */

const ErrorLogger = require("../../ErrorLogger");
const Util = require("../../../common/Util");
const CheckColumnCount = require("../../../rules/CheckColumnCount");

QUnit.test( "Util: getRootDirectory w/ empty config Test", function(assert){
   const result = Util.getRootDirectory(null);

   assert.equal(result, ".", "Expected '.'");
});


QUnit.test( "Util: getRuleName Test", function(assert){
   const config = {
       "filename" : "TestRuleSetName",
       "config" : {
           "columns" : 9
       }
   };

   const result = Util.getRuleName(config);

   assert.equal(result, "TestRuleSetName", "Expected 'TestRuleSetName");
});

// QUnit.test( "Util: getRuleSets Test", function(assert){
//    const config = {
//        "rootDir" : "."
//    }
//
//    const result = Util.getRulesets(config.rootDir);
//    assert.equal(result, "package.json", "Expected");
// });

QUnit.test( "Util: getRootTempDirectory", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDir" : "."
   };

   const result = Util.getRootTempDirectory(config, config.rootDir);
   assert.ok(result, "Expected a result.");
});

QUnit.test( "Util: getTempDirectory Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "rootDir" : "."
   }

   const result = Util.getTempDirectory(config, config.rootDir);
   assert.notEqual(result, null, "Expected");

});


QUnit.test( "Util: createGUID Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger
   };

   const result = Util.createGUID();
   assert.notEqual(result, null, "Expected");
});

QUnit.test( "Util: getCurrentDateTimeString", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger
   };

   const result = Util.getCurrentDateTimeString();
   const cDate = new Date();
   assert.equal(result, cDate.getFullYear() + "_" + (cDate.getMonth()+1) + "_" + cDate.getDate() + "_" + cDate.getHours() + "_" + cDate.getMinutes() + "_" + cDate.getSeconds(), "Expected current date and time")

});