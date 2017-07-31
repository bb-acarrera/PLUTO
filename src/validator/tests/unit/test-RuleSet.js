/**
 * Created by cgerber on 18/07/2017.
 */

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../runtime/api/RuleAPI");
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
});
