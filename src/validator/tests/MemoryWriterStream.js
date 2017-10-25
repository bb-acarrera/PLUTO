const stream = require('stream');

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

module.exports = MemoryWriterStream;
