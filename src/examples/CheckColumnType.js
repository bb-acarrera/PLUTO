const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckColumnType extends CSVRuleAPI {
	constructor(config) {
		super(config);

		const type = config.Type.toLowerCase();
		switch (type) {
			case 'string':
				this.test = function(datum) {
					return typeof datum === 'string'
				};
				break;
			case 'number':
				this.test = function(datum) {
					return !isNaN(datum);
				}
				break;
			case 'regex': {
				if (!this.config.RegEx)
					this.error(`${this.constructor.name} Type is 'regex' but no RegEx property defined'.`);
				else {
					const regex = new RegExp(this.config.RegEx);
					this.test = function (datum) {
						return regex.text(datum);
					}
				}
				break;
			}
			default:
				this.error(`${this.constructor.name} configured with an unrecognized data type. Expected "string", "number", or "regex" but got '${config.Type}'.`);
				break;
		}

		this.rowNumber = 0;
		this.numHeaderRows = this.config.NumberOfHeaderRows || 0;
		if (isNaN(this.numHeaderRows)) {
			this.error(`${this.constructor.name} configured with a non-number NumberOfHeaderRows. Got '${config.NumberOfHeaderRows}', using 0.`);
			this.numHeaderRows = 0;
		}
		else if (this.numHeaderRows < 0) {
			this.error(`${this.constructor.name} configured with a negative NumberOfHeaderRows. Got '${config.NumberOfHeaderRows}', using 0.`);
			this.numHeaderRows = 0;
		}

		this.column = undefined;
		if (!this.config.Column)
			this.error(`${this.constructor.name} configured without a Column property.`);
		else if (isNaN(this.config.Column))
			this.error(`${this.constructor.name} configured with a non-number Column. Got '${config.Column}'.`);
		else if (this.config.Column < 0)
			this.error(`${this.constructor.name} configured with a negative Column. Got '${config.Column}'.`);
		else if (!Number.isInteger(this.config.Column))
			this.error(`${this.constructor.name} configured with a non-integer Column. Got '${config.Column}'.`);
		else
			this.column = this.config.Column;

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.ReportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.column && this.rowNumber >= this.numHeaderRows) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`${constructor.name} row ${this.rowNumber} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else if (this.test && !this.test(record[this.column]))	// Is the cell in the column valid?
				this.error(`${this.constructor.name} row ${this.rowNumber} column ${this.column}: Expected a ${this.config.Type} but got ${record[this.column]}.`);
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
