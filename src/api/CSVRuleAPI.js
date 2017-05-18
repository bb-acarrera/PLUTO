const MemoryReaderStream = require("../validator/MemoryReaderStream");
const MemoryWriterStream = require("../validator/MemoryWriterStream");
const RuleAPI = require("./RuleAPI");

const fs = require("fs");
const parse = require('csv-parse');
const stringify = require('csv-stringify');
const transform = require('stream-transform');

class CSVRuleAPI extends RuleAPI {
	constructor(config) {
		super(config)
	}

	/**
	 * Derived classes should override this method if they need to do anything before the processing of the data starts.
	 */
	start() {
		// Do any pre-processing.
	}

	/**
	 * Derived classes should override this method if they need to do anything after the processing of records is complete.
	 */
	finish() {
		// Do any post-processing.
	}

	/**
	 * Derived classes should implement this method to process individual records.
	 * @param record one record from the csv file.
	 * @returns {*} a record, either the original one if no modifications were carried out or a new one.
	 */
	processRecord(record) {
		// Process the record and return the new record.
		return record;
	}

	/**
	 * Process a CSV stream.
	 * @param inputStream {stream} the stream to read from.
	 * @param outputStream {stream} the stream to write to. (May be null/undefined.)
	 * @private
	 */
	processCSV(inputStream, outputStream) {
		// Need "relax_column_count" otherwise the parser throws an exception. I'd rather detect it.
		const parser = parse({delimiter: ',', relax_column_count: true});			// TODO: Need to get options from the config file.

		// This CSV Transformer is used to call the processRecord() method above.
		const transformer = transform(record => {
			return this.processRecord(record);
		});
		transformer.once("finish", () => {
			this.finish();	// Finished so let the derived class know.
		});

		this.start();

		if (outputStream) {
			// Only need to stringify if actually outputting anything.
			const stringifier = stringify({delimiter: ',', relax_column_count: true});		// TODO: Ditto.
			inputStream.pipe(parser).pipe(transformer).pipe(stringifier).pipe(outputStream);
		}
		else
			inputStream.pipe(parser).pipe(transformer);
	}

	/*
	 * RuleAPI methods. These are not exposed to users of the CSVRuleAPI.
	 */
	canUseStreams() { return true; }
	canUseMethod() { return true; }
	canUseFiles() { return true; }

	/**
	 * Add a notification onto the inputStream before moving on to processing the streams.
	 * @param inputStream the stream containing the CSV to process.
	 * @param outputStream the stream that will receive the processed results.
	 * @private
	 */
	useStreams(inputStream, outputStream) {
		inputStream.once('readable', () => {
			// Note that this is done as soon as there is data rather than at the end. Otherwise the buffers would fill without any way to drain them.
			this.emit(RuleAPI.NEXT, outputStream);
		});
		this.processCSV(inputStream, outputStream)
	}

	/**
	 * Convert files to streams (the preferred solution) for processing a CSV file.
	 * @param inputFile the file containing CSV data to process.
	 * @private
	 */
	useFiles(inputFile) {
		const tempFileName = this.config.validator.getTempName(this.config.validator.config);
		const writer = fs.createWriteStream(tempFileName);
		writer.once("finish", () => {
			this.emit(RuleAPI.NEXT, tempFileName);
		});
		const reader = fs.createReadStream(inputFile);
		this.processCSV(reader, writer);
	}

	/**
	 * Convert in-memory data to streams (the preferred solution) for processing a CSV file.
	 * @param data the CSV data to process.
	 * @private
	 */
	useMethod(data) {
		const writer = new MemoryWriterStream();
		writer.once("finish", () => {
			this.emit(RuleAPI.NEXT, writer.getData(this.encoding));
		});
		const reader = new MemoryReaderStream(data);
		this.processCSV(reader, writer);
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = CSVRuleAPI;	// Export this so derived classes can extend it.
module.exports.instance = CSVRuleAPI;	// Export this so the application can instantiate the class without knowing it's name.
