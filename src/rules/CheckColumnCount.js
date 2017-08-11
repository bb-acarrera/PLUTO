const TableRuleAPI = require("../api/TableRuleAPI");

class CheckColumnCount extends TableRuleAPI {
	constructor(config) {
		super(config);

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

	start(parser) {
		this.parser = parser;
	}

	processRecord(record, rowId) {

		if (this.columns !== undefined) {
			if (record.length !== this.columns) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${rowId} has wrong number of columns. Got ${record.length}.`);
					this.badColumnCountReported = true;
				}
			}
		}

		return record;
	}


	get processHeaderRows() {
		return true;
	}

	static get ConfigProperties() {
		return [
			{
				name: 'columns',
				type: 'integer',
				label: 'Number of Columns',
				minimum: '1',
				tooltip: 'The expected number of columns in the input file.'
			},
			{
				name: 'reportAlways',
				label: 'Report All Errors?',
				type: 'boolean',
				tooltip: 'Report all errors encountered or just the first.'
			}
		];
	}

	static get ConfigDefaults() {
		return {
			columns: 9,
			reportAlways: false
		};
	}
}

module.exports = CheckColumnCount;
