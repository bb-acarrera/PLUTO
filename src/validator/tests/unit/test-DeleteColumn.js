/**
 * Created by cgerber on 2017-07-21.
 */
const stream = require('stream');

const ErrorLogger = require("../../ErrorLogger");
const RuleAPI = require("../../../runtime/api/RuleAPI");
const DeleteColumn = require("../../../runtime/rules/DeleteColumn");

/*
 * A trivial class which takes input from a stream and captures it in a buffer.
 */
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

QUnit.test( "DeleteColumn: Creation Test", function(assert){
   const logger = new ErrorLogger();
   const config = {
       "_debugLogger" : logger,
       "column" : 0
   }

   const data = "Column 0, Column 1\na, b";
   const rule = new DeleteColumn(config);
   const done = assert.async();
   rule._run( { data: data }).then((result) => {
	   	assert.ok(result, "Created");
	   	const logResults = logger.getLog();
		const writer = new MemoryWriterStream();
		writer.on('finish', () => {
			const dataVar = writer.getData();
			console.log("dataVar = " + dataVar);

			assert.equal(dataVar, "Column 1\nb", "Expected only column 1");
			done();
		})
	   	result.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
    });

});

/*
QUnit.test( "DeleteColumn: Column Delete Test", function(assert){
    const logger = new ErrorLogger();
    const config = {
        "_debugLogger" : logger,
        "rowNumber" : 1,
        "column" : 1
    }

    const deleter = new DeleteColumn(config);
    assert.ok(deleter, "Column was deleted");

});
*/

/*
QUnit.test( "DeleteColumn: processRecord test", function(assert){


});
*/