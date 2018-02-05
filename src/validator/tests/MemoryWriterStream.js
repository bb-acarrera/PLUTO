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

	static getStream(string, encoding = 'utf8') {
		const s = new stream.Readable;

		s.push(string, encoding);
		s.push(null);

		return s;
	}

	static getRuleStreamObject(string, encoding) {
		return {
			stream: MemoryWriterStream.getStream(string, encoding)
		};
	}
}

module.exports = MemoryWriterStream;
