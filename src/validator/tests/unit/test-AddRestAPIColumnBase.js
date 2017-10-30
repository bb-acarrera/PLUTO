/**
 * Created by cgerber on 2017-07-21.
 */
const proxyquire = require('proxyquire');
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const CSVParser = require("../../../rules/CSVParser");
const MemoryWriterStream = require("../MemoryWriterStream");

function requestHandler(options, callback) {
    if(options.requestHandler) {
        options.requestHandler(options, callback);
        return;
    }

    callback(null, {statusCode: 200}, 'response body');

}

const AddRestAPIColumnBase = proxyquire("../../../rules/internal/AddRestAPIColumnBase",
    {
        request: (options, callback) => {
                requestHandler(options, callback);
            }


    });


class TestRestAPI extends AddRestAPIColumnBase {
    constructor(config, parser) {
        super(config, parser);

    }

    request(record, rowId) {
        return { requestHandler: this.config.requestHandler };
    }

    handleResponse(error, body, record, rowId) {

        if(this.config.handleResponse) {
            return this.config.handleResponse(error, body, record, rowId);
        }

        return body;
    }

    get newColumnName() {
        return this.config.newColumn;
    }
}

QUnit.module("AddRestAPIColumnBase");

QUnit.test( "Valid config", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "_debugLogger" : logger,
        newColumn: 'new column',
        maxConcurrent: 5,
        sharedData: sharedData
    };

    const parserConfig = {
        "_debugLogger" : logger,
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        sharedData: sharedData
    };

    const parser = new CSVParser(parserConfig, TestRestAPI, config);

    assert.equal(parser.tableRule.maxConcurrent, 5, "Expected maxConcurrent to be 5");

});

QUnit.test( "no maxConcurrent", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "_debugLogger" : logger,
        newColumn: 'new column',
        sharedData: sharedData
    };

    const parserConfig = {
        "_debugLogger" : logger,
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        sharedData: sharedData
    };

    const parser = new CSVParser(parserConfig, TestRestAPI, config);

    assert.equal(parser.tableRule.maxConcurrent, 100, "Expected maxConcurrent to be 100");

});

QUnit.test( "bad maxConcurrent", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "_debugLogger" : logger,
        newColumn: 'new column',
        maxConcurrent: "blah",
        sharedData: sharedData
    };

    const parserConfig = {
        "_debugLogger" : logger,
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        sharedData: sharedData
    };

    const parser = new CSVParser(parserConfig, TestRestAPI, config);

    assert.equal(parser.tableRule.maxConcurrent, 100, "Expected maxConcurrent to be 100");

});

QUnit.test( "Check added column", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "_debugLogger" : logger,
        newColumn: 'new column',
        sharedData: sharedData
    };

    const parserConfig = {
        "_debugLogger" : logger,
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        sharedData: sharedData
    };

    const data = "Column 0,Column 1\na,b";
    const parser = new CSVParser(parserConfig, TestRestAPI, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {

            assert.equal(logResults.length, 0, "Expected 0 errors/warnings");

            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,response body\n", "Expected 3 columns");
            done();
        });
        result.stream.pipe(writer);
    });

});

QUnit.test( "maxConcurrent exceeded", function(assert){
    const logger = new ErrorLogger();
    const sharedData = {};
    const config = {
        "_debugLogger" : logger,
        newColumn: 'new column',
        maxConcurrent: 2,
        sharedData: sharedData,
        requestHandler: (options, callback) => {
            setTimeout(() => {
                callback(null, {statusCode: 200}, 'response body');
            }, 1000);
        }
    };

    const parserConfig = {
        "_debugLogger" : logger,
        "numHeaderRows" : 1,
        "columnNames" : [ "Column 0", "Column 1" ],
        sharedData: sharedData
    };

    const data = "Column 0,Column 1\na,b\na,b\na,b";
    const parser = new CSVParser(parserConfig, TestRestAPI, config);

    const done = assert.async();
    parser._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {

            assert.equal(logResults.length, 0, "Expected 0 errors/warnings");

            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 0,Column 1,new column\na,b,response body\na,b,response body\na,b,response body\n", "Expected 3 columns, 4 rows");
            done();
        });
        result.stream.pipe(writer);
    });

});

QUnit.module("");