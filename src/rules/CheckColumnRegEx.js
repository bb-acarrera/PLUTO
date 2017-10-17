const TableRuleAPI = require("../api/TableRuleAPI");

class CheckColumnRegEx extends TableRuleAPI {
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

		this.column = this.getValidatedColumnProperty();
		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record, rowId) {
		if (this.column !== undefined) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${rowId} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else if (this.test && !this.test(record[this.column]))	// Is the cell in the column valid?
				this.error(`Row ${rowId}, Column ${this.column}: Expected a match of ${this.config.regex} but got ${record[this.column]}.`);
		}

		return record;
	}


	static get ConfigProperties() {
		return [
			{
				name: 'column',
				label: 'Column',
				type: 'column',
				minimum: '0',
				tooltip: 'The column to run the regular expression against.'
			},
			{
				name: 'regex',
				label: 'Regular Expression',
				type: 'string',
				tooltip: 'The regular expression to use to validate the given column.'
			}
		];
	}


	static get ConfigDefaults() {
		return {
			reportAlways: false
		};
	}

}

module.exports = CheckColumnRegEx;
