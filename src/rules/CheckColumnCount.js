const TableRuleAPI = require("../api/TableRuleAPI");

class CheckColumnCount extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

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

	processRecord(record, rowId) {

		let internalColumnCount = 0;
		if(this.parser && this.parser.internalColumns) {
			internalColumnCount = this.parser.internalColumns.length;
		}

		if (this.columns !== undefined) {

			const numRecords = record.length - internalColumnCount;

			if (numRecords < this.columns) {
				this.error(`Row ${rowId} has too few columns. Got ${numRecords}.`, rowId);
			} else if(numRecords > this.columns) {
				this.warning(`Row ${rowId} has too many columns. Got ${numRecords}.`, rowId)
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
				tooltip: 'The expected number of columns in the input file.',
				validations: [
					{
						number : {
							min: 1
						}
					},
					{
						presence: true
					}
				]
			}
		]);
	}

	static get ConfigDefaults() {
		return this.appendDefaults({
			columns: 9
		});
	}

	static get Descriptions() {
		return {
			shortDescription: "Verify the number of columns in the records in a CSV file.",
			longDescription: "This rule verifies that the number of columns in the records in a CSV file is correct. An error is reported if there are too few columns and a warning is reported if there are too many columns."
		}
	}
}

module.exports = CheckColumnCount;
