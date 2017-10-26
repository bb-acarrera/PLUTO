const TableRuleAPI = require("../api/TableRuleAPI");

/* internal rule used by the CSVParser, do not add to the manifest */

class DeleteInternalColumn extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);


	}

	processRecord(record) {
		// Remove the column from each record.
		if (this.column != undefined) {
			if (record.length >= this.column)
				record.splice(this.column, 1);
		}

		return record;
	}

	start() {

		this.column = this.getValidatedColumnProperty();
	}

	finish() {
		// Remove the column label from the shared list of column labels.
		if (this.column !== undefined && this.parser && this.parser.removeInternalColumn) {
			this.parser.removeInternalColumn(this.column);
		}
	}

	get processHeaderRows() {
		return true;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'column',
				label: 'Column To Delete',
				type: 'column',
				tooltip: 'The column label for the column to delete.'
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({});
	}
}

module.exports = DeleteInternalColumn;
