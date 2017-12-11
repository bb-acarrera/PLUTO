/**
 * Created by cgerber on 2017-07-24.
 */
const fs = require('fs-extra');
const path = require("path");
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const MemoryWriterStream = require("../MemoryWriterStream");

const RunExternalProcess = require("../../../rules/RunExternalProcess");

var originalCWD;

QUnit.module("RunExternalProcess tests", {
    before: function() {
        originalCWD = process.cwd();

        if (!originalCWD.endsWith("src"))
			process.chdir("src");
			
		if (!process.env.PLUTOAPI)
			process.env['PLUTOAPI'] = path.resolve(process.cwd(), "api");
    },
    after: function() {
        process.chdir(originalCWD);
    }

});

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
        assert.notOk(true, error);
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
        assert.notOk(true, error);
        done();
    });
});

// We have to assume at least a minimal config is passed in.
//QUnit.test( "RunExternalProcess: Missing config test", function(assert) {
//    const logger = new ErrorLogger();
//
//    const data = "Hello World";
//    const rule = new RunExternalProcess(null);
//
//    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
//    // exists it means a different rule created an identically named socket which is a problem.)
//    if (fs.existsSync(rule.socketName))
//        fs.unlinkSync(rule.socketName);
//
//    const done = assert.async();
//
//    assert.ok(rule, "Rule was created.");
//
//    rule._run({data: data}).then((result) => {
//        console.log(result);
//        assert.ok(typeof(result) == "string", "Expected a string result.");
//        done();
//    }, (error) => {
//        assert.ok(error.includes("Internal Error: Failed to properly construct the RunExternalProcess rule."), "Expected an error stating 'Internal Error: Failed to properly construct the RunExternalProcess rule.'.");
//        done();
//    });
//});

// Also need at least a tempDirectory.
//QUnit.test( "RunExternalProcess: Missing tempDirectory test", function(assert) {
// const logger = new ErrorLogger();
// const config = {
//         __state : {
//             "_debugLogger" : logger,
//         },
//         "attributes" : {
//             "filename":"validateFilename",
//             "script" : "rules/validateFilename.py",
//             "executable" : "python"
//         },
//         "id" : 1,
//         "importConfig" : {
//             "file" : "foo.bar"  // Should catch this error.
//         }
//     };
//
// const data = "Hello World";
// const rule = new RunExternalProcess(config);
//
// // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
// // exists it means a different rule created an identically named socket which is a problem.)
// if (fs.existsSync(rule.socketName))
//     fs.unlinkSync(rule.socketName);
//
// const done = assert.async();
//
// assert.ok(rule, "Rule was created.");
//
// rule._run({data: data}).then((result) => {
//     const logResults = logger.getLog();
//     assert.ok(logResults.length == 1, "Expected one error result.");
//     assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
//     assert.ok(logResults[0].description.includes("Internal Error: No tempDirectory."), "Expected the error to contain 'Internal Error: No tempDirectory.'.")
//     done();
// }, (error) => {
//     assert.notOk(true, error);
//     done();
// });
//});

QUnit.test( "RunExternalProcess: Missing attributes test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
          __state : {
              "_debugLogger" : logger,
              "tempDirectory" : "/var/tmp" 
          },
          "id" : 1,
          "importConfig" : {
              "file" : "foo.bar"  // Should catch this error.
          }
    };

    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);
    
    const done = assert.async();
    
    assert.ok(rule, "Rule was created.");
    
    rule._run({data: data}).then((result) => {
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("No rule attributes set."), "Expected the error to contain 'No rule attributes set.'.")
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});

QUnit.test( "RunExternalProcess: Missing regex test", function(assert) {
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
        "importConfig" : {
            "file" : "foo.bar"  // Should catch this error.
        }
    };

    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);

    const done = assert.async();

    assert.ok(rule, "Rule was created.");

    rule._run({data: data}).then((result) => {
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("No regex specified."), "Expected the error to contain 'No regex specified.'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});

QUnit.test( "RunExternalProcess: Missing importConfig test.", function(assert) {
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
        "regex" : ".*\\.csv"
    };

    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);

    const done = assert.async();

    rule._run({data: data}).then((result) => {
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("No importConfig specified in the rule config."), "Expected the error to contain 'No importConfig specified in the rule config.'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});

QUnit.test( "RunExternalProcess: Missing importConfig.file test.", function(assert) {
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
        "importConfig" : {
        },
        "regex" : ".*\\.csv"
    };

    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);

    const done = assert.async();

    rule._run({data: data}).then((result) => {
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("No file specified in the rule config.importConfig."), "Expected the error to contain 'No file specified in the rule config.importConfig.'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});

// Skipping this as it requires additional setup
QUnit.skip( "RunExternalProcess: Can't find PythonAPI test.", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"validateFilename",
            "script" : "src/rules/validateFilename.py",
            "executable" : "python"
        },
        "id" : 1,
        "importConfig" : {
        },
        "regex" : ".*\\.csv"
    };

    const cwd = process.cwd();
    process.chdir("..");
    
    const data = "Hello World";
    const rule = new RunExternalProcess(config);

    // Remove the socket if it exists. The rule shouldn't do this since it gets a fresh tempDir in real use and if the socket
    // exists it means a different rule created an identically named socket which is a problem.)
    if (fs.existsSync(rule.socketName))
        fs.unlinkSync(rule.socketName);

    const done = assert.async();

    rule._run({data: data}).then((result) => {
        process.chdir(cwd); // NOTE: If this isn't run then other tests in the entire test suite will fail.
        const logResults = logger.getLog();
        assert.ok(logResults.length == 1, "Expected one error result.");
        assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
        // assert.equal(logResults[1].type, "Error", "Expected an 'Error'.");
        assert.ok(logResults[0].description.includes("Failed to load the PythonAPI."), "Expected the error to contain 'Failed to load the PythonAPI.'.")
        // assert.ok(logResults[1].description.includes("exited with status 1"), "Expected the error to contain 'exited with status 1'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error);
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
        assert.notOk(true, error);
        done();
    });
});

QUnit.test( "RunExternalProcess: Can't find executable test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"fluffyBunny",
            "executable" : "fluffyBunny"
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
        assert.ok(logResults.length == 2, "Expected two errors in result.");
        assert.equal(logResults[0].type, "Warning", "Expected first result to be a 'Warning'.");
        assert.equal(logResults[1].type, "Error", "Expected second result to be an 'Error'.");
        assert.ok(logResults[1].description.includes("Launching script failed with error"), "Expected the error to contain 'Launching script failed with error'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});

QUnit.test( "RunExternalProcess: Failing executable test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"False",
            "executable" : "false"
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
        assert.ok(logResults.length == 2, "Expected two errors in result.");
        assert.equal(logResults[0].type, "Warning", "Expected first result to be a 'Warning'.");
        assert.equal(logResults[1].type, "Error", "Expected second result to be an 'Error'.");
        assert.ok(logResults[1].description.includes("exited with status 1"), "Expected the error to contain 'exited with status 1'.")
        
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});

QUnit.test( "RunExternalProcess: Executable writing to stdout test", function(assert) {
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger,
            "tempDirectory" : "/var/tmp" 
        },
        "attributes" : {
            "filename":"Echo",
            "executable" : "echo"
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
        assert.ok(logResults.length == 2, "Expected two errors in result.");
        assert.equal(logResults[0].type, "Warning", "Expected first result to be a 'Warning'.");
        assert.equal(logResults[1].type, "Warning", "Expected second result to be an 'Warning'.");
        assert.ok(logResults[1].description.includes("echo wrote to stdout"), "Expected the error to contain 'echo wrote to stdout'.")
        assert.notOk(fs.existsSync(result.file), result.file + " does exist."); // The result should not be created by an echo command.
        
        done();
    }, (error) => {
        assert.notOk(true, error);
        done();
    });
});
