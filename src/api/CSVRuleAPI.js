const MemoryReaderStream = require("../validator/MemoryReaderStream");
const MemoryWriterStream = require("../validator/MemoryWriterStream");
const RuleAPI = require("./RuleAPI");

const fs = require("fs");
const parse = require('csv-parse');
const stringify = require('csv-stringify');
const transform = require('stream-transform');

/**
 *  <p>This base class describes an API derived classes implement to add Javascript based CSV rules. The only method that
 *  must be implemented is {@link CSVRuleAPI#processRecord CSVRuleAPI.processRecord()} which is called by the validator
 *  once for each record in the CSV file and is used to examine a record for problems or
 *  to modify it. If problems are detected in a record then {@link RuleAPI#error RuleAPI.error()},
 *  {@link RuleAPI#warning RuleAPI.warning()}, or
 *  {@link RuleAPI#info RuleAPI.info()} should be called with a description of the problem.</p>
 *  <p>Derived classes can also implement {@link CSVRuleAPI#start CSVRuleAPI.start()} which is called once by the validator before reading any
 *  records. A derived class could implement this to initialize any resources. Similarly derived classes could
 *  implement {@link CSVRuleAPI#finish CSVRuleAPI.finish()} which is called once by the validator after the last call to
 *  {@link CSVRuleAPI#processRecord CSVRuleAPI.processRecord()}. A derived class could implement this to finalize any resources.</p>
 *  <p>This class supports several properties on the configuration object that affect the parsing of CSV files.</p>
 *  <ul>
 *      <li>Delimiter - the delimiter character separating fields in a record. Defaults to a commma.</li>
 *      <li>Comment - the comment character. Any text following this character is ignored. Ignored by default.</li>
 *      <li>Escape - the single character used to allow the delimiter character to be used in a field. Defaults to a double quote.</li>
 *      <li>Quote - the single character surrounding fields. Defaults to a double quote.</li>
 *  </ul>
 *  <p>These properties are shared when reading and writing records but if a rule wants to write rules differently than
 *  they were read, for example changing the delimiter, prefixing any of these property names with "Output"
 *  (ex. "OutputDelimiter") will set the property on output only.</p>
 */
class CSVRuleAPI extends RuleAPI {
	/**
	 * Derived classes must call this from their constructor.
	 * @constructor
	 * @param config {object} the config object passed into the derived class's constructor.
	 */
	constructor(config) {
		super(config)

		this.delimiter = this.config.Delimiter || ',';
		this.comment = this.config.Comment || '';
		this.escape = this.config.Escape || '"';
		this.quote = this.config.Quote || '"';

		this.post_delimiter = this.config.OutputDelimiter || ',';
		this.post_comment = this.config.OutputComment || '';
		this.post_escape = this.config.OutputEscape || '"';
		this.post_quote = this.config.OutputQuote || '"';
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
	 * @param record {array} one record from the csv file. Headers are not skipped.
	 * @returns {array} a record, either the original one if no modifications were carried out or a new one.
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
		const parser = parse(
			{
				delimiter: this.delimiter,
				comment: this.comment,
				escape: this.escape,
				quote: this.quote,
				relax_column_count: true		// Need "relax_column_count" otherwise the parser throws an exception when rows have different number so columns.
												// I'd rather detect it.
			});

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
			const stringifier = stringify({
				delimiter: this.post_delimiter,
				comment: this.post_comment,
				escape: this.post_escape,
				quote: this.post_quote,
				relax_column_count: true		// Need "relax_column_count" otherwise the parser throws an exception when rows have different number so columns.
				// I'd rather detect it.
			});
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
