const Readable = require('stream').Readable;

/*
 * A trivial class which takes a data array and streams it.
 */
class MemoryReaderStream extends Readable {
	constructor(data) {
		super();
		this.data = Buffer.from(data);
	}

	_read(size) {
		this.push(this.data);
		this.push(null);
	}
}

module.exports = MemoryReaderStream;
