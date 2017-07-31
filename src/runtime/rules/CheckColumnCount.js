const CSVRuleAPI = require("../../api/CSVRuleAPI");

class CheckColumnCount extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.rowNumber = 0;

		this.columns = undefined;
		if (!this.config)
			this.error('No configuration specified.');
		else if (this.config.columns === undefined)
			this.error("Configured without a 'columns' property.");
		else if (isNaN(this.config.columns))
			this.error(`Configured with a non-number columns. Got '${config.columns}'.`);
		else if (this.config.columns < 0)
			this.error(`Configured with a negative columns. Got '${config.columns}'.`);
		else if (!Number.isInteger(parseFloat(this.config.columns)))
			this.error(`Configured with a non-integer columns. Got '${config.columns}'.`);
		else
			this.columns = parseFloat(this.config.columns);

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config && this.config.reportAlways ? this.config.reportAlways : false;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.columns !== undefined) {
			if (record.length !== this.columns) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${this.rowNumber} has wrong number of columns. Got ${record.length}.`);
					this.badColumnCountReported = true;
				}
			}
		}

		this.rowNumber++;
		return record;
	}
}

module.exports = CheckColumnCount;
