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
		super(config);

		this.delimiter = this.config.delimiter || ',';
		this.comment = this.config.comment || '';
		this.escape = this.config.escape || '"';
		this.quote = this.config.quote || '"';

		this.post_delimiter = this.config.OutputDelimiter || ',';
		this.post_comment = this.config.OutputComment || '';
		this.post_escape = this.config.OutputEscape || '"';
		this.post_quote = this.config.OutputQuote || '"';
	}

	/**
	 * Given the value of a property this validates whether the given value is a valid number of header rows
	 * and if so returns it otherwise an error is posted to the log and <code>0</code> is
	 * returned.
	 * @param headerRowsProperty the value of a config header rows property. If this is <code>undefined</code>
	 * then <code>this.config.numberOfHeaderRows</code> is used.
	 * @param headerRowsPropertyName the name of the property to use in error messages. Defaults to 'numberOfHeaderRows'.
	 * @returns the number of header rows given by headerRowsProperty or 0 if the value is not valid.
	 */
	getValidatedHeaderRows(headerRowsProperty, headerRowsPropertyName) {
		headerRowsProperty = headerRowsProperty == undefined ? this.config.numberOfHeaderRows : headerRowsProperty;
		headerRowsPropertyName = headerRowsPropertyName == undefined ? 'numberOfHeaderRows' : headerRowsPropertyName;

		var result = 0;
		if (!this.config.numberOfHeaderRows)
			this.warning(`Configured without a '${headerRowsPropertyName}' property. Using ${result}.`);
		else if (isNaN(headerRowsProperty))
			this.warning(`Configured with a non-number '${headerRowsPropertyName}'. Got '${headerRowsProperty}', using ${result}.`);
		else if (headerRowsProperty < 0)
			this.warning(`Configured with a negative '${headerRowsPropertyName}'. Got '${headerRowsProperty}', using ${result}.`);
		else {
			result = Math.floor(parseFloat(headerRowsProperty));
			if (!Number.isInteger(parseFloat(headerRowsProperty)))
				this.warning(`Configured with a non-integer '${headerRowsPropertyName}'. Got '${headerRowsProperty}', using ${result}.`);
		}

		return result;
	}

	/**
	 * Given the value of a property this validates whether the given value is a column label or column number
	 * and if so returns the column number otherwise an error is posted to the log and <code>undefined</code> is
	 * returned.
	 * @param propertyValue the value of a config column property. If this is <code>undefined</code> then
	 * <code>this.config.column</code> is used.
	 * @param propertyName the name of the property - used in error messages. Defaults to 'column' if not set.
	 * @returns the column number represented by the propertyValue or undefined if the value is not valid.
	 */
	getValidatedColumnProperty(propertyValue, propertyName) {
		propertyValue = propertyValue == undefined ? this.config.column : propertyValue;
		propertyName = propertyName == undefined ? 'column' : propertyName;

		var result = undefined;
		if (propertyValue === undefined)
			this.error(`Configured without a '${propertyName}' property.`);
		else if (isNaN(propertyValue)) {
			let sharedData = this.config.sharedData;
			if (sharedData && sharedData.columnLabels) {
				let columnLabels = sharedData.columnLabels;
				if (columnLabels.length == undefined) {
					this.error(`Shared 'columnLabels' is not an array.`);
					return result;
				}
				else if (columnLabels.length == 0) {
					this.error(`Shared 'columnLabels' has no content.`);
					return result;
				}

				// Found a column label not index.
				let index = columnLabels.indexOf(propertyValue);
				if (index < 0)
					this.error(`Configured with a column label '${propertyValue}' that is not in sharedData.columnLabels.`);
				else
					result = index;
			}
			else
				this.error(`Configured with a non-number '${propertyName}'. Got '${propertyValue}'.`);
		}
		else if (propertyValue < 0)
			this.error(`Configured with a negative '${propertyName}'. Got '${propertyValue}'.`);
		else {
			result = Math.floor(parseFloat(propertyValue));
			if (!Number.isInteger(parseFloat(propertyValue)))
				this.warning(`Configured with a non-integer '${propertyName}'. Got '${propertyValue}', using ${result}.`);
		}
		return result;
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
	_processCSV(inputStream, outputStream) {
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

	run() {
		this._processCSV(this.inputStream, this.outputStream);
		return this.outputStream;
	}
}

module.exports = CSVRuleAPI;	// Export this so derived classes can extend it.
