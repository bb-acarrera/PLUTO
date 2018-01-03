const TableRuleAPI = require("../api/TableRuleAPI");

class DeleteColumn extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		this.checkValidColumnProperty();
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
		// Because of the asynchronous nature of streams this modification of the shared data must be done
		// before the rule starts rather than at the end. Otherwise following rules would start with the unmodified
		// version of the shared data. Not what is desired.

		this.column = this.getValidatedColumnProperty();

	}

	finish() {
		// Remove the column label from the shared list of column labels.
		if (this.column !== undefined && this.parser) {
			this.parser.removeColumn(this.column);
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
				tooltip: 'The column label for the column to delete.',
				validations: [
					{
						presence: true
					}
				]
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({});
	}

	static get Descriptions() {
		return {
			shortDescription: "Delete a column from a CSV file.",
			longDescription: "This rule deletes a column from the records in a CSV file. No errors are reported if the column does not exist.",
			title: "Delete Column"
		}
	}
}

module.exports = DeleteColumn;
