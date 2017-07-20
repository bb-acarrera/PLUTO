/**
 * Created by cgerber on 18/07/2017.
 */

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../runtime/api/RuleAPI");

QUnit.test( "ErrorLogger: Creation Test", function(assert) {
    const logger = new ErrorLogger();

    assert.ok(logger, "Logger was created");

});

QUnit.test( "ErrorLogger: Level Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debuglogger" : logger
   };

   assert.ok(logger, "Logger was created");

   logger.log("LEVEL_WARNING", "", 0, "");
   const logResults = logger.getLog();
   assert.equal(logResults[0], "LEVEL_WARNING", "Expect null");

});

QUnit.test( "ErrorLogger: ProblemFileName Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger
   };

   assert.ok(logger, "Logger was created");

   logger.log(null, "TEST_FILE", 0, "");
   const logResults = logger.getLog();
   assert.equal(logResults[1], "TEST_FILE", "Expect TEST_FILE.");

});

QUnit.test( "ErrorLogger: RuleID Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger
   };

   assert.ok(logger, "Logger was created");

   logger.log(null, "", 1, "");
   const logResults = logger.getLog();
   assert.equal(logResults[2], 1, "Expect 1");

});

QUnit.test( "ErrorLogger: ProblemDescription Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger
    };

    assert.ok(logger, "Logger was created");

    logger.log(null, "", 0, "Test Description");
    const logResults = logger.getLog();
    assert.equal(logResults[3], "Test Description", "Expect \"Test Description\"");

});