/**
 * Created by cgerber on 2017-07-24.
 */
const fs = require('fs-extra');
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../api/RuleAPI");
const RunPythonScript = require("../../../rules/RunPythonScript");

QUnit.test( "RunPythonScript: Run test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger": logger,
        "pythonScript": "../../../test_config/copy.py",
    };

    const data = "Hello World";
    const rule = new RunPythonScript(config);
    rule.tempDir = "/var/tmp";

    const done = assert.async();

    assert.ok(rule, "Rule was created.");

    rule._run({data: data}).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        // assert.ok(result.file, "File Created");
        // assert.ok(fs.existsSync(result.file), "Doesn't Exist.");

        done();
    }, (error) => {
        assert.notOk(true, error.message);
        done();
    });
});