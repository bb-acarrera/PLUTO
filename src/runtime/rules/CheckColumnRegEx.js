const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckColumnRegEx extends CSVRuleAPI {
	constructor(config) {
		super(config);

		if (!config) {
			this.error('No configuration specified.');			// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}

		if (!this.config.regex) {
			this.error(`No 'regex' property defined'.`);
			return;
		}
		else {
			const regex = new RegExp(this.config.regex);
			this.test = function (datum) {
				return regex.test(datum);
			}
		}

		this.rowNumber = 0;
		this.numHeaderRows = this.getValidatedHeaderRows();
		this.column = this.getValidatedColumnProperty();
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
				this.error(`Row ${this.rowNumber}, Column ${this.column}: Expected a match of ${this.config.regex} but got ${record[this.column]}.`);
		}

		this.rowNumber++;
		return record;
	}
}

module.exports = CheckColumnRegEx;
