/**
 * Created by cgerber on 2017-07-21.
 */

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../runtime/api/RuleAPI");
const DeleteColumn = require("../../../runtime/rules/DeleteColumn");
/*
QUnit.test( "DeleteColumn: Creation Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "column" : 0
   }

   const data = "Column 0, Column 1\na, b";
   const rule = new DeleteColumn(config);
   const done = assert.async();
   rule._run( { data: data }).then((result) => {
        const dataVar = result.data;
        const logResults = logger.getLog();
        console.log(result);
        assert.ok(result, "Created");
        assert.equal(dataVar, "Column 1\nb", "Expected only column 1");
        done();
    });

});
*/

/*
QUnit.test( "DeleteColumn: Column Delete Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rowNumber" : 1,
        "column" : 1
    }

    const deleter = new DeleteColumn(config);
    assert.ok(deleter, "Column was deleted");

});
*/

/*
QUnit.test( "DeleteColumn: processRecord test", function(assert){


});
*/