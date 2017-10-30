/**
 * Created by cgerber on 2017-07-21.
 */
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const DeleteColumn = require("../../../rules/DeleteColumn");
const CSVParser = require("../../../rules/CSVParser");
const MemoryWriterStream = require("../MemoryWriterStream");

QUnit.test( "DeleteColumn: Deletion Test", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "_debugLogger" : logger,
        "column" : 'Column 0',
        sharedData: sharedData
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        sharedData: sharedData
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, DeleteColumn, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 1\nb\n", "Expected only column 1");
            done();
        });
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "DeleteColumn: Select Deletion Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "column" : 1
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, DeleteColumn, config);
    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0\na\n", "Expected only column 1");
            done();
        })
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "DeleteColumn: Negative Column Delete Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "column" : -1
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const rule = new DeleteColumn(config);
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

QUnit.test( "DeleteColumn: No Column Property test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger
    };

    const parserConfig = {
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ]
    };

    const data = "Column 0,Column 1\na,b";
    const rule = new DeleteColumn(config);
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
