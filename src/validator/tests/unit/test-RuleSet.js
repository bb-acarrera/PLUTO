/**
 * Created by cgerber on 18/07/2017.
 */

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../runtime/api/RuleAPI");

QUnit.test( "RuleSet: Creation Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debuglLogger" : logger,
       "ruleset" : {
           "name": "testRuleSet",
           "rules": [
               {
                    "filename": "CheckColumnCount",
                    "name": "Test RuleSet Creation using CheckColumnCount",
                    "config": {
                        "columns": 9
                    }
               }
           ]
       }

   }

   const rules = new RuleSet(config);

   assert.ok(rules, "RuleSet was created");

});

QUnit.test( "RuleSet: Creation Test no name", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "ruleset" : {
           "rules": [
               {
                   "filename" : "CheckColumnCount",
                   "name" : "Test RuleSet creation using CheckColumnCount",
                   "config" : {
                       "columns" : 9
                   }
               }
           ]
       }
   }

   const rules = new RuleSet(config);

   assert.ok(rules, "RuleSet was created with no name property");

});

QUnit.test( "RuleSet: Creation Test no rules", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "ruleset" : {
           "name" : "testRuleSet"
       }
   }

   const rules = new RuleSet(config);

   assert.ok(rules, "RuleSet was created with no rules property");

});

QUnit.test( "RuleSet: Import Creation Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "ruleset" : {
            "name" : "Test RuleSet Import",
            "rules" : [
                {
                    "filename" : "CheckColumnCount",
                    "name" : "Test RuleSet import using CheckColumnCount",
                    "config" : {
                        "columns" : 9
                    }
                }
            ],
            "import" : {
                "scriptPath" : "/opt/PLUTO/config/import.js",
                "config" : {
                    "file" : "/opt/PLUTO/config/test_data/simplemaps-worldcities-basic.csv"
                }
            }
        }
    }

    const rules = new RuleSet(config);

    assert.ok(rules, "RuleSet was created with import property");

});

QUnit.test( "RuleSet: Export Creation Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "ruleset" : {
            "name" : "Test RuleSet Export",
            "rules" : [
                {
                    "filename" : "CheckColumnCount",
                    "name" : "Test RuleSet export using CheckColumnCount",
                    "config" : {
                        "columns" : 9
                    }
                }
            ],
            "export" : {
                "scriptPath" : "/opt/PLUTO/config/import.js",
                "config" : {
                    "file" : "/opt/PLUTO/config/test_data/simplemaps-worldcities-basic.csv.out"
                }
            }
        }
    }

    const rules = new RuleSet(config);

    assert.ok(rules, "RuleSet was created with export property");

});

QUnit.test( "RuleSet: Creation Test with all four properties", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "ruleset" : {
            "name" : "Test RuleSet All Properties",
            "rules" : [
                {
                    "filename" : "CheckColumnCount",
                    "name" : "Test RuleSet using all properties",
                    "config" : {
                        "columns" : 9
                    }
                }
            ],
            "import" : {
                "scriptPath" : "/opt/PLUTO/config/import.js",
                "config" : {
                    "file" : "/opt/PLUTO/config/test_data/simplemaps-worldcities-basic.csv"
                }
            },
            "export" : {
                "scriptPath" : "/opt/PLUTO/config/export.js",
                "config" : {
                    "file" : "/opt/PLUTO/config/test_data/simplemaps-worldcities-basic.csv.out"
                }
            }
        }
    }

    const rules = new RuleSet(config);

    assert.ok(rules, "RuleSet was created with all properties");

})

QUnit.test( "RuleSet: toJSON Check", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debuglLogger" : logger,
        "ruleset" : {
            "name": "testRuleSet",
            "rules": [
                {
                    "filename": "CheckColumnCount",
                    "name": "Test RuleSet Creation using CheckColumnCount",
                    "config": {
                        "columns": 9
                    }
                }
            ]
        }

    }

    const rules = new RuleSet(config);
    const rulesJSON = rules.toJSON();

    const logResults = logger.getLog();
    assert.equal(rulesJSON.name, rules.name, "Expected 'testRuleSet' in JSON file");
    assert.equal(rulesJSON.rules, rules.rules, "Expected matching rules in JSON file");

});

QUnit.test( "RuleSet: addRules Test", function(assert){


});