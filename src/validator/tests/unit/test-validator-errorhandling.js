const ErrorLogger = require("../../ErrorLogger");
const validator = require("../../../validator/validator");
const DataProxy = require("../dbProxy");


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

    const ruleset = {
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
    };

    const done = assert.async();

    const dbProxy = new DataProxy(ruleset,
        () => {
            assert.equal(vldtr.abort, false, "Expected run to succeed");
        },
        done);


    const vldtr = new validator(config, dbProxy.getDataObj());

    vldtr.runRuleset("src/validator/tests/testDataCSVFile.csv", "output.csv", 'UTF8');

});
