const CSVRuleAPI = require("../api/CSVRuleAPI");

class DeleteColumn extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.rowNumber = 0;
		this.column = this.getValidatedColumnProperty();
	}

	processRecord(record) {
		// Remove the column from each record.
		if (this.column != undefined) {
			if (record.length >= this.column)
				record.splice(this.column, 1);
		}

		this.rowNumber++;
		return record;
	}

	start() {
		// Because of the asynchronous nature of streams this modification of the shared data must be done
		// before the rule starts rather than at the end. Otherwise following rules would start with the unmodified
		// version of the shared data. Not what is desired.

		// Remove the column label from the shared list of column labels.
		if (this.column !== undefined
			&& this.config.sharedData
			&& this.config.sharedData.columnLabels
			&& this.config.sharedData.columnLabels.length != undefined
			&& this.config.sharedData.columnLabels.length >= this.column)
			this.config.sharedData.columnLabels.splice(this.column, 1);
	}
}

module.exports = DeleteColumn;
