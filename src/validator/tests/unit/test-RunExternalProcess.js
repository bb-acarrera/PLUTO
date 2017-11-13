/**
 * Created by cgerber on 2017-07-24.
 */
const fs = require('fs-extra');
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const MemoryWriterStream = require("../MemoryWriterStream");

const RunExternalProcess = require("../../../rules/RunExternalProcess");

QUnit.test( "RunExternalProcess: Successful run test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"validateFilename",
            "script" : "rules/validateFilename.py",
            "executable" : "python"
        },
        "id" : 1,
        "regex" : ".*\\.csv",
        "importConfig" : {
            "file" : "foo.csv"
        }
    };

    if (!process.cwd().endsWith("src"))
        process.chdir("src");
    
    const data = "Hello World";
    const rule = new RunExternalProcess(config);
    assert.ok(rule.socketName, "Rule did not allocate a socketName.");
    
    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);
    
    const done = assert.async();

    assert.ok(rule, "Rule was created.");

    rule._run({data: data}).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        assert.ok(logResults.length == 0, "Expected no error results, got " + logResults.length + "."); // \n\t" + logResults[0].type + ": " + logResults[0].description + "\n...");
        assert.ok(result, "Expected a result.");
        assert.ok(result.hasOwnProperty("file"), "Expected a file property on the result.");
        assert.ok(typeof result.file == "string", "Expected the file property to be a String");
        assert.ok(result.file, "File Created");
        assert.ok(fs.existsSync(result.file), result.file + " doesn't exist.");
        
        var contents = fs.readFileSync(result.file);
        assert.equal(contents, data, "Generated file is not correct.");
        done();
    }, (error) => {
        assert.notOk(true, error.message);
        done();
    });
});

QUnit.test( "RunExternalProcess: Error test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"validateFilename",
            "script" : "rules/validateFilename.py",
            "executable" : "python"
        },
        "id" : 1,
        "regex" : ".*\\.csv",
        "importConfig" : {
            "file" : "foo.bar"  // Should catch this error.
        }
    };

    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    assert.ok(rule.socketName, "Rule did not allocate a socketName.");
    
    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);

    const done = assert.async();

    assert.ok(rule, "Rule was created.");

    rule._run({data: data}).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("does not match"), "Expected the error to contain 'does not match'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error.message);
        done();
    });
});

QUnit.test( "RunExternalProcess: Can't find script test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"foobar",
            "script" : "foobar.py",
            "executable" : "python"
        },
        "id" : 1,
        "importConfig" : {
            "file" : "foo.bar"  // Should catch this error.
        }
    };

    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    assert.ok(rule.socketName, "Rule did not allocate a socketName.");
    
    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);

    const done = assert.async();

    assert.ok(rule, "Rule was created.");

    rule._run({data: data}).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("foobar.py does not exist."), "Expected the error to contain 'foobar.py does not exist.'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error.message);
        done();
    });
});

