/**
 * Created by cgerber on 2017-07-21.
 */
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const MoveColumn = require("../../../runtime/rules/MoveColumn");
const RuleAPI = require("../../../runtime/api/RuleAPI");

class MemoryWriterStream extends stream.Writable {
    constructor(options) {
        super(options);
        this.buffer = Buffer.from(''); // empty
    }

    _write(chunk, enc, cb) {
        // our memory store stores things in buffers
        const buffer = (Buffer.isBuffer(chunk)) ?
            chunk :  // already is Buffer use it
            new Buffer(chunk, enc);  // string, convert

        // concat to the buffer already there
        this.buffer = Buffer.concat([this.buffer, buffer]);

        // console.log("MemoryWriterStream DEBUG: " + chunk.toString());

        cb(null);
    }

    getData(encoding) {
        return this.buffer.toString(encoding);
    }
}

QUnit.test( "MoveColumn: Move Column Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "column" : 0,
        "after" : 1
    }


    const data = "Column 0,Column 1\na,b";
    const rule = new MoveColumn(config);
    const done = assert.async();
    rule._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(dataVar, "Column 1,Column 0\nb,a\n", "Expected column 0 and column 1 to switch");
            done();
        })
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "MoveColumn: Negative Column Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "column" : -1,
        "after" : 1
    }


    const data = "Column 0,Column 1\na,b";
    const rule = new MoveColumn(config);
    const done = assert.async();
    rule._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();

            assert.equal(logResults[0].type, "Error", "Expected \"Error\"");
            done();
        })
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

})

QUnit.test( "MoveColumns: Before and After property test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "column" : 0,
       "before" : 1,
       "after" : 2
   };

    const data = "Column 0,Column 1\na,b";
    const rule = new MoveColumn(config);
    const done = assert.async();

    const logResults = logger.getLog();

    assert.equal(logResults.length, 1, "Expected 1, got " + logResults.length);
    done();

});

QUnit.test( "MoveColumns: Moving Column Relative to Itself test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "column" : 0,
        "after" : 0
    };

    const data = "Column 0,Column 1\na,b";
    const rule = new MoveColumn(config);
    const done = assert.async();
    rule._run( { data: data }).then((result) => {
        assert.ok(result, "Created");
        const logResults = logger.getLog();
        const writer = new MemoryWriterStream();
        writer.on('finish', () => {
            const dataVar = writer.getData();
            //console.log("dataVar = " + dataVar);

            assert.equal(logResults.length, 1, "Expected 1 result.");
            assert.equal(logResults[0].type, "Error", "Expected\"Error\".");
            assert.equal(logResults[0].description, "Can't move a column relative to itself.", "Expected\"Can't move a column onto itself.\".")
            done();
        })
        result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

QUnit.test( "MoveColumns: No Columns Property test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "after" : 2
   };

   const rule = new MoveColumn(config);
   const done = assert.async();
   const logResults = logger.getLog();

   assert.equal(logResults.length, 1, "Expected 1 result.");
   assert.equal(logResults[0].type, "Error", "Expcted \"Error\".");
   assert.equal(logResults[0].description, "Configured without a 'column' property.", "Expected \"Configured without a 'column' property.\".");
   done();

});