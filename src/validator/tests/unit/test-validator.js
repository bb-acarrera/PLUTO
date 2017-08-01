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
