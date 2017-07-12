const CSVRuleAPI = require("../api/CSVRuleAPI");

class DeleteColumn extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.rowNumber = 0;

		this.column = undefined;
		if (!this.config)
			this.error('No configuration specified.');
		else if (this.config.column === undefined)
			this.error("Configured without a 'column' property.");
		else if (isNaN(this.config.column)) {
			if (config.sharedData && config.sharedData.columnLabels) {
				if (config.sharedData.columnLabels.length == undefined) {
					this.error(`Shared 'columnLabels' is not an array.`);
					return;
				}
				else if (config.sharedData.columnLabels.length == 0) {
					this.error(`Shared 'columnLabels' has no content.`);
					return;
				}

				// Found a column label not index.
				let index = this.config.sharedData.columnLabels.indexOf(this.config.column);
				if (index < 0)
					this.error(`Configured with a column label '${this.config.column}' that is not in sharedData.columnLabels.`);
				else
					this.column = index;
			}
			else
				this.error(`Configured with a non-number column. Got '${this.config.column}'.`);
		}
		else if (this.config.column < 0)
			this.error(`Configured with a negative columns. Got '${config.column}'.`);
		else if (!Number.isInteger(parseFloat(this.config.column)))
			this.error(`Configured with a non-integer columns. Got '${config.column}'.`);
		else
			this.column = parseFloat(this.config.column);
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

	finish() {
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
