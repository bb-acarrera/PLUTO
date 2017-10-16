/**
 * Created by cgerber on 18/07/2017.
 */

const ErrorLogger = require("../../ErrorLogger");
const RuleSet = require("../../../validator/RuleSet")

QUnit.test( "RuleSet: Creation Test", function(assert){
   const config = {
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

   };

   const rules = new RuleSet(config);

   assert.ok(rules, "RuleSet was not created");

});

QUnit.test( "RuleSet: Creation Test no name", function(assert){
   const config = {
       "rules": [
               {
                   "filename" : "CheckColumnCount",
                   "name" : "Test RuleSet creation using CheckColumnCount",
                   "config" : {
                       "columns" : 9
                   }
               }
           ]
   };

   const rules = new RuleSet(config);

   assert.ok(rules, "RuleSet was not created with no name property");

});

QUnit.test( "RuleSet: Creation Test no rules", function(assert){
   const config = {
           "name" : "testRuleSet"
   };

   const rules = new RuleSet(config);

   assert.ok(rules, "RuleSet was not created with no rules property");

});

QUnit.test( "RuleSet: Import Creation Test", function(assert){
    const config = {
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
    };

    const rules = new RuleSet(config);

    assert.ok(rules, "RuleSet was not created with import property");

});

QUnit.test( "RuleSet: Export Creation Test", function(assert){
    const config = {
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
    };

    const rules = new RuleSet(config);

    assert.ok(rules, "RuleSet was not created with export property");

});

QUnit.test( "RuleSet: Creation Test with all four properties", function(assert){
    const config = {
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
    };

    const ruleset = new RuleSet(config);

    assert.ok(ruleset, "RuleSet was created with all properties");
    assert.ok(ruleset.name, "RuleSet has a name");
	assert.ok(ruleset.id, "RuleSet has a id");
	assert.ok(ruleset.filename, "RuleSet has a filename");
	assert.ok(ruleset.rules, "RuleSet has rules");
	assert.ok(ruleset.import, "RuleSet has an importer");
	assert.ok(ruleset.export, "RuleSet has an exporter");
    assert.equal(ruleset.rules.length, 1, "Expected one rule");
});

QUnit.test( "RuleSet: Creation Test check error defaults", function(assert){
    const config = {
        "name" : "Test RuleSet All Properties",
        "rules" : []
    };

    const ruleset = new RuleSet(config);


    assert.ok(ruleset.errors, "RuleSet was created with errors");
    assert.equal(ruleset.errors.onError, "abort", "Expected default onError to be abort");
    assert.equal(ruleset.errors.errorsToAbort, 1, "Expected default errorsToAbort to be 1");
    assert.ok(ruleset.errors.warningsToAbort == null, "Expected default warningsToAbort to be not exist");

});

QUnit.test( "RuleSet: Creation Test check error config", function(assert){
    const config = {
        "name" : "Test RuleSet All Properties",
        "rules" : [],
        "errors" : {
            "onError": "removeRow",
            "errorsToAbort": 2,
            "warningsToAbort": 1,
            "singleRuleErrorsToAbort": 1,
            "singleRuleWarningsToAbort": 1
        }
    };

    const ruleset = new RuleSet(config);


    assert.ok(ruleset.errors, "RuleSet was created with errors");
    assert.equal(ruleset.errors.onError, "removeRow", "Expected onError to be abort");
    assert.equal(ruleset.errors.errorsToAbort, 2, "Expected errorsToAbort to be 2");
    assert.equal(ruleset.errors.warningsToAbort, 1, "Expected warningsToAbort to be 1");
    assert.equal(ruleset.errors.singleRuleErrorsToAbort, 1, "Expected singleRuleErrorsToAbort to be 1");
    assert.equal(ruleset.errors.singleRuleWarningsToAbort, 1, "Expected singleRuleWarningsToAbort to be 1");

});

QUnit.test( "RuleSet: Creation Test rule error default", function(assert){
    const config = {
        "name" : "Test RuleSet All Properties",
        "rules" : [
            {
                "filename" : "CheckColumnCount",
                "name" : "Test RuleSet using all properties",
                "config" : {
                    "columns" : 9
                }
            }
        ]
    };

    const ruleset = new RuleSet(config);


    assert.equal(ruleset.rules[0].config.onError, "abort", "Expected default onError to be abort");
    assert.ok(ruleset.rules[0].config.errorsToAbort == null, "Expected default errorsToAbort to be not exist");
    assert.ok(ruleset.rules[0].config.warningsToAbort == null, "Expected default warningsToAbort to be not exist");

});

QUnit.test( "RuleSet: Creation Test rule defaults from parent error config", function(assert){
    const config = {
        "name" : "Test RuleSet All Properties",
        "errors" : {
            "onError": "removeRow",
            "errorsToAbort": 2,
            "warningsToAbort": 1,
            "singleRuleErrorsToAbort": 3,
            "singleRuleWarningsToAbort": 2
        },
        "rules" : [
            {
                "filename" : "CheckColumnCount",
                "name" : "Test RuleSet using all properties",
                "config" : {
                    "columns" : 9
                }
            }
        ]
    };

    const ruleset = new RuleSet(config);


    assert.equal(ruleset.rules[0].config.onError, "removeRow", 'Expected onError to be "removeRow"');
    assert.equal(ruleset.rules[0].config.errorsToAbort, 3, "Expected default errorsToAbort to be 3");
    assert.equal(ruleset.rules[0].config.warningsToAbort, 2, "Expected default warningsToAbort to be 2");

});

QUnit.test( "RuleSet: Creation Test rule error config", function(assert){
    const config = {
        "name" : "Test RuleSet All Properties",
        "rules" : [
            {
                "filename" : "CheckColumnCount",
                "name" : "Test RuleSet using all properties",
                "config" : {
                    "columns" : 9,
                    "onError" : "removeRow",
                    "errorsToAbort": 2,
                    "warningsToAbort": 1
                }
            }
        ]
    };

    const ruleset = new RuleSet(config);


    assert.equal(ruleset.rules[0].config.onError, "removeRow", 'Expected onError to be "removeRow"');
    assert.equal(ruleset.rules[0].config.errorsToAbort, 2, "Expected default errorsToAbort to be 2");
    assert.equal(ruleset.rules[0].config.warningsToAbort, 1, "Expected default warningsToAbort to be 1");

});
