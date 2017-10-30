/**
 * Created by cgerber on 2017-07-21.
 */
const proxyquire = require('proxyquire');
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const CSVParser = require("../../../rules/CSVParser");
const MemoryWriterStream = require("../MemoryWriterStream");

function requestCallbackHandler(options, callback) {
    if(options.callback) {
        options.callback(options, callback);
        return;
    }

    callback(null, {statusCode: 200}, 'response body');

}

const AddRestAPIColumnBase = proxyquire("../../../rules/internal/AddRestAPIColumnBase",
    {
        request: (options, callback) => {
                requestCallbackHandler(options, callback);
            }


    });


class TestRestAPI extends AddRestAPIColumnBase {
    constructor(config, parser) {
        super(config, parser);

    }

    request(record, rowId) {
        return { callback: this.config.callback };
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

QUnit.test( "Add column Test", function(assert){
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

QUnit.module("");