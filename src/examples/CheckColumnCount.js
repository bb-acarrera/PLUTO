const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckColumnCount extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.rowNumber = 0;

		this.columns = undefined;
		if (!this.config.Columns)
			this.error(`${constructor.name} configured without a Columns property.`);
		else if (isNaN(this.config.Columns))
			this.error(`${constructor.name} configured with a non-number Columns. Got '${config.Columns}'.`);
		else if (this.config.Columns < 0)
			this.error(`${constructor.name} configured with a negative Columns. Got '${config.Columns}'.`);
		else if (!Number.isInteger(this.config.Columns))
			this.error(`${constructor.name} configured with a non-integer Columns. Got '${config.Columns}'.`);
		else
			this.columns = this.config.Columns;

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.ReportAlways || false;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.columns) {
			if (record.length !== this.columns) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`${constructor.name} row ${this.rowNumber} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
		}

		this.rowNumber++;
		return record;
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {CheckColumnCount}
 */
module.exports = CheckColumnCount;	// Export this so derived classes can extend it.
module.exports.instance = CheckColumnCount;	// Export this so the application can instantiate the class without knowing it's name.
