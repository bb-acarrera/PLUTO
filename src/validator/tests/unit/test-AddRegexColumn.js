/**
 * Created by cgerber on 2017-07-21.
 */
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const AddRegExColumn = require("../../../rules/AddRegExColumn");
const CSVParser = require("../../../rules/CSVParser");
const MemoryWriterStream = require("../MemoryWriterStream");

QUnit.test( "AddRegExColumn: Add column Test", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "column" : 'Column 0',
        newColumn: 'new column',
        regex: '[\\s\\S]*',
        __state: {
            "_debugLogger" : logger,
            sharedData: sharedData
        }
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        __state: {
            sharedData: sharedData
        }
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,a\n", "Expected 3 columns");
            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "AddRegExColumn: Select add column Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger
        },
        "column" : 1,
        newColumn: 'new column',
        regex: '[\\s\\S]*'
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);
    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,b\n", "Expected 3 columns");
            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "AddRegExColumn: Add column no match Test", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "column" : 'Column 0',
        newColumn: 'new column',
        regex: '$a',
        __state: {
            "_debugLogger" : logger,
            sharedData: sharedData
        }
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        __state: {
            sharedData: sharedData
        }
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,\n", "Expected 3 columns, with nothing in 3rd");

            assert.equal(logResults.length, 0, "Expected 0 log result.");

            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "AddRegExColumn: Add column no match warning Test", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "column" : 'Column 0',
        newColumn: 'new column',
        regex: '$a',
        failType: 'Warning',
        __state: {
            "_debugLogger" : logger,
            sharedData: sharedData
        }
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        __state: {
            sharedData: sharedData
        }
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,\n", "Expected 3 columns, with nothing in 3rd");

            assert.equal(logResults.length, 1, "Expected 1 log results.");

            if (logResults.length > 0) {
                assert.equal(logResults[0].type, "Warning", "Expected a 'Warning'.");
            }

            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "AddRegExColumn: Add column no match error Test", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "column" : 'Column 0',
        newColumn: 'new column',
        regex: '$a',
        failType: 'Error',
        __state: {
            "_debugLogger" : logger,
            sharedData: sharedData
        }
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        __state: {
            sharedData: sharedData
        }
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,\n", "Expected 3 columns, with nothing in 3rd");

            assert.equal(logResults.length, 1, "Expected 1 log results.");

            if (logResults.length > 0) {
                assert.equal(logResults[0].type, "Error", "Expected an 'Error'.");
            }

            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "AddRegExColumn: Negative Column Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger
        },
        "column" : -1,
        newColumn: 'new column',
        regex: '[\\s\\S]*'
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const rule = new AddRegExColumn(config);
    const parser = new CSVParser(parserConfig, rule);
    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(rule, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            assert.equal(logResults.length, 1, "Expected 1 result.");
            assert.equal(logResults[0].type, "Error", "Expected \"Error\".");
            done();
        });
        result.stream.pipe(writer);

    });

});

QUnit.test( "AddRegExColumn: No Column Property test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger
        },
        newColumn: 'new column',
        regex: '[\\s\\S]*'
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const rule = new AddRegExColumn(config);
    const parser = new CSVParser(parserConfig, rule);
    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(rule, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            assert.equal(logResults.length, 1, "Expected 1 result.");
            assert.equal(logResults[0].type, "Error", "Expected \"Error\".");
            done();
        });
        result.stream.pipe(writer);

    });

});

QUnit.test( "AddRegExColumn: No new Column Property test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger
        },
        column: 'Column 0',
        regex: '[\\s\\S]*'
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);
    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            assert.equal(logResults.length, 1, "Expected 1 result.");
            assert.equal(logResults[0].type, "Error", "Expected \"Error\".");
            done();
        });
        result.stream.pipe(writer);

    });
});

QUnit.test( "AddRegExColumn: No regex Property test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        __state : {
            "_debugLogger" : logger
        },
        column: 'Column 0',
        newColumn: 'new column'
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, AddRegExColumn, config);
    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            assert.equal(logResults.length, 1, "Expected 1 result.");
            assert.equal(logResults[0].type, "Error", "Expected \"Error\".");
            done();
        });
        result.stream.pipe(writer);

    });
});
