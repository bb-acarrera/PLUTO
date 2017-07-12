const CSVRuleAPI = require("../api/CSVRuleAPI");

class MoveColumn extends CSVRuleAPI {
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
					this.error(`Configured with a 'column' label '${this.config.column}' that is not in sharedData.columnLabels.`);
				else
					this.column = index;
			}
			else
				this.error(`Configured with a non-number 'column'. Got '${this.config.column}'.`);
		}
		else if (this.config.column < 0)
			this.error(`Configured with a negative 'column'. Got '${config.column}'.`);
		else if (!Number.isInteger(parseFloat(this.config.column)))
			this.error(`Configured with a non-integer 'column'. Got '${config.column}'.`);
		else
			this.column = parseFloat(this.config.column);

		let newLocation = this.config.before || this.config.after || undefined;
		let moveType = this.config.before ? "before" : (this.config.after ? "after" : undefined);
		if (newLocation === undefined)
			this.error("Configured without a 'before' or 'after' property.");
		else if (this.config.before && this.config.after)
			this.error("Configured with both a 'before' and an 'after' property.");
		else if (isNaN(newLocation)) {
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
				let index = this.config.sharedData.columnLabels.indexOf(newLocation);
				if (index < 0)
					this.error(`Configured with a ${moveType} column label '${newLocation}' that is not in sharedData.columnLabels.`);
				else
					newLocation = index;
			}
			else
				this.error(`Configured with a non-number '${moveType}' column. Got '${newLocation}'.`);
		}
		else if (newLocation < 0)
			this.error(`Configured with a negative '${moveType}' column. Got '${newLocation}'.`);
		else if (!Number.isInteger(parseFloat(newLocation)))
			this.error(`Configured with a non-integer '${moveType}' column. Got '${newLocation}'.`);
		else
			newLocation = parseFloat(newLocation);

		if (newLocation == this.column)
			this.error("Can't move a column relative to itself.");
		else if (moveType == "after" && this.column == newLocation + 1)
			this.error("Can't move a column onto itself.");
		else if (moveType == "before" && this.column == newLocation - 1)
			this.error("Can't move a column onto itself.");
		else if (moveType == "before")
			this.toColumn = newLocation;
		else
			this.toColumn = newLocation + 1;

		if (this.toColumn && this.toColumn > this.column)
			this.toColumn--;	// this.column will be deleted so account for this in the destination index.
	}

	processRecord(record) {
		// Remove the column from each record.
		if (this.column != undefined && this.toColumn != undefined) {
			if (record.length >= this.column) {
				let field = record[this.column];
				record.splice(this.column, 1);
				// insert field into the record at this.toColumn
				record.splice(this.toColumn, 0, field);
			}
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
		{
			let field = this.config.sharedData.columnLabels[this.column];
			this.config.sharedData.columnLabels.splice(this.column, 1);
			this.config.sharedData.columnLabels.splice(this.toColumn, 0, field);
		}
	}
}

module.exports = MoveColumn;
