const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckColumnType extends CSVRuleAPI {
	constructor(config) {
		super(config);

		if (!config) {
			this.error('No configuration specified.');			// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}
		else if (!config.Type) {
			this.error(`Configured without a 'Type' property.`);
			return; // Ditto
		}
		else {
			const type = config.Type.toLowerCase();
			switch (type) {
				case 'string':
					this.test = function (datum) {
						return typeof datum === 'string'
					};
					break;
				case 'number':
					this.test = function (datum) {
						return !isNaN(datum);
					}
					break;
				case 'regex': {
					if (!this.config.RegEx)
						this.error(`Type is 'regex' but no 'RegEx' property defined'.`);
					else {
						const regex = new RegExp(this.config.RegEx);
						this.test = function (datum) {
							return regex.test(datum);
						}
					}
					break;
				}
				default:
					this.error(`Configured with an unrecognized data type. Expected 'string', 'number', or 'regex' but got '${config.Type}'.`);
					break;
			}
		}

		this.rowNumber = 0;
		this.numHeaderRows = 0;
		if (!this.config.NumberOfHeaderRows)
			this.warning(`Configured without a 'NumberOfHeaderRows' property. Using ${this.numHeaderRows}.`);
		else if (isNaN(this.config.NumberOfHeaderRows))
			this.warning(`Configured with a non-number NumberOfHeaderRows. Got '${this.config.NumberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else if (this.config.NumberOfHeaderRows < 0)
			this.warning(`Configured with a negative NumberOfHeaderRows. Got '${this.config.NumberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else {
			this.numHeaderRows = Math.floor(parseFloat(this.config.NumberOfHeaderRows));
			if (!Number.isInteger(parseFloat(this.config.NumberOfHeaderRows)))
				this.warning(`Configured with a non-integer NumberOfHeaderRows. Got '${this.config.NumberOfHeaderRows}', using ${this.numHeaderRows}.`);
		}

		this.column = undefined;
		if (this.config.Column === undefined)
			this.error(`Configured without a 'Column' property.`);
		else if (isNaN(this.config.Column))
			this.error(`Configured with a non-number Column. Got '${this.config.Column}'.`);
		else if (this.config.Column < 0)
			this.error(`Configured with a negative Column. Got '${this.config.Column}'.`);
		else {
			this.column = Math.floor(parseFloat(this.config.Column));
			if (!Number.isInteger(parseFloat(this.config.Column)))
				this.warning(`Configured with a non-integer Column. Got '${this.config.Column}', using ${this.column}.`);
		}

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.ReportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.column !== undefined && this.rowNumber >= this.numHeaderRows) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${this.rowNumber} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else if (this.test && !this.test(record[this.column]))	// Is the cell in the column valid?
				this.error(`Row ${this.rowNumber}, Column ${this.column}: Expected a ${this.config.Type} but got ${record[this.column]}.`);
		}

		this.rowNumber++;
		return record;
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {CheckColumnType}
 */
module.exports = CheckColumnType;	// Export this so derived classes can extend it.
module.exports.instance = CheckColumnType;	// Export this so the application can instantiate the class without knowing it's name.
