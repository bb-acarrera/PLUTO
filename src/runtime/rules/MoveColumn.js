const CSVRuleAPI = require("../api/CSVRuleAPI");

class MoveColumn extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.rowNumber = 0;

		this.column = this.getValidatedColumnProperty();
		var newLocation = undefined;
		if (this.config.before && this.config.after) {
			this.error("Configured with both a 'before' and an 'after' property.");
			return;
		}
		else if (this.config.before)
			newLocation = this.getValidatedColumnProperty(this.config.before, 'before');
		else if (this.config.after)
			newLocation = this.getValidatedColumnProperty(this.config.after, 'after');
		else {
			this.error("Configured without a 'before' or 'after' property.");
			return;
		}
		let moveType = this.config.before ? "before" : (this.config.after ? "after" : undefined);

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

	start() {
		// Because of the asynchronous nature of streams this modification of the shared data must be done
		// before the rule starts rather than at the end. Otherwise following rules would start with the unmodified
		// version of the shared data. Not what is desired.
		
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
