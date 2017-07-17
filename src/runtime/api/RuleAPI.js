const fs = require('fs-extra');
const stream = require('stream');
const streamToPromise = require('stream-to-promise');
const BaseRuleAPI = require('./BaseRuleAPI');

/*
 * A trivial class which takes a data array and streams it.
 */
class MemoryReaderStream extends stream.Readable {
	constructor(data) {
		super();
		this.data = Buffer.from(data);
	}

	_read(size) {
		this.push(this.data);
		this.push(null);
	}
}

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

/**
 * This API class is used to describe the interface to rule operations. The methods indicate how the
 * data can be passed to and from the rule. Multiple input and output methods can return true. This allows the
 * application to select the best option for connecting two rules together.
 *
 * The class extends EventEmitter so that rules run asynchronously. When a rule completes it should post the static
 * {@link RuleAPI.NEXT} value.
 */
class RuleAPI extends BaseRuleAPI {
	/**
	 * The base constructor. This simply sets <code>this.config</code> to the passed in configuration object. This config object
	 * will be the rule's individual configuration (if any) and additionally contain <code>RootDirectory</code> which defaults to
	 * the application's root directory if not set, <code>TempDirectory</code> which defaults to the application's temporary
	 * directory if not set, <code>OutputEncoding</code> which is set to the rule's Encoding if set or to the ruleset's Encoding
	 * if set, and <code>utf8</code> if none are set, and <code>Encoding</code> which is set to the input file's encoding. (Note
	 * the distinction between <code>Encoding</code> and <code>OutputEncoding</code>. <code>Encoding</code> is set to the source file's encoding and
	 * <code>OutputEncoding</code> is set to the encoding of the file generated by the rule. In general these would be the same
	 * but rule's may want to switch one uncommon encoding for another more common one.)
	 * @param localConfig {object} the rule's configuration as defined in the ruleset file or a standalone config file.
	 */
	constructor(localConfig) {
		super(localConfig);
	}

	hasFilename() {
		return typeof this._data == 'string';
	}

	hasStream() {
		return this._data instanceof stream.Readable;
	}

	hasObject() {
		return this._data && !this.hasFilename() && !this.hasStream();
	}

	get object() {
		if (this._object)
			return this._object;
		else if (this._objectPromise)
			return this._objectPromise;	// User really shouldn't query this more than once but we also don't want to create multiple Promises.

		if (this.hasFilename())
			this._object = this.config.validator.loadFile(this._data, this.config.encoding);
		else if (this.hasStream()) {
			const writer = new MemoryWriterStream();
			this._data.stream.pipe(writer);	// I'm presuming this is blocking. (The docs don't mention either way.)
			this._object = writer.getData(this.config.encoding);

			this._objectPromise = streamToPromise(writer).then(() => {
				this._objectPromise = undefined;
				this._object = writer.getData(this.config.encoding);
				return this._object;
			});
			return this._objectPromise;
		}
		else
			this._object = this._data;

		return this._object;
	}

	get inputFile() {
		if (this._inputFile)
			return this._inputFile;
		else if (this._inputPromise)
			return this._inputPromise;	// User really shouldn't be doing this but don't want to create a new Promise.

		if (this.hasFilename())
			this._inputFile = this._data;
		else if (hasStream()) {
			// The last rule output to a stream but the new rule requires the data in a file. So write the
			// stream into a file and when done call the next rule.
			const tempFileName = this.config.validator.getTempName();
			const writer = fs.createWriteStream(tempFileName);
			this._data.stream.pipe(writer);

			this._inputPromise = streamToPromise(writer).then(() => {
				this._inputPromise = undefined;
				this._inputFile = tempFileName;
				return tempFileName;
			});
			return this._inputPromise;
		}
		else
			this._inputFile = this.config.validator.saveLocalTempFile(this._data, this.config.encoding);

		return this._inputFile;
	}

	get outputFile() {
		if (!this._outputFile)
			this._outputFile = this.config.validator.getTempName();
		return this._outputFile;
	}

	get inputStream() {
		if (this._inputStream)
			return this._inputStream;

		if (this.hasStream())
			this._inputStream = this._data;
		else if (this.hasFilename())
			this._inputStream = fs.createReadStream(this._data);
		else
			this._inputStream = new MemoryReaderStream(this._data);	// TODO: Put this class into the RuleAPI file.

		return this._inputStream;
	}

	get outputStream() {
		if (!this._outputStream)
			this._outputStream = new stream.PassThrough();
		return this._outputStream;
	}
}

module.exports = RuleAPI;	// Export this so derived classes can extend it.
