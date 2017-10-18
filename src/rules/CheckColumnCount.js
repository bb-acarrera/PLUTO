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


	}

	start(parser) {
		this.parser = parser;
	}

	processRecord(record, rowId) {

		if (this.columns !== undefined) {
			if (record.length < this.columns) {
				this.error(`Row ${rowId} has too few columns. Got ${record.length}.`);
			} else if(record.length > this.columns) {
				this.warning(`Row ${rowId} has too many columns. Got ${record.length}.`)
			}
		}

		return record;
	}


	get processHeaderRows() {
		return true;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'columns',
				type: 'integer',
				label: 'Number of Columns',
				minimum: '1',
				tooltip: 'The expected number of columns in the input file.'
			}
		]);
	}

	static get ConfigDefaults() {
		return this.appendDefaults({
			columns: 9
		});
	}
}

module.exports = CheckColumnCount;
