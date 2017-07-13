const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckColumnType extends CSVRuleAPI {
	constructor(config) {
		super(config);

		if (!config) {
			this.error('No configuration specified.');			// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}
		else if (!config.type) {
			this.error(`Configured without a 'type' property.`);
			return; // Ditto
		}
		else {
			const type = config.type.toLowerCase();
			switch (type) {
				case 'string':
					this.test = function (datum) {
						return typeof datum === 'string'
					};
					break;
				case 'float':
				case 'number':
					this.test = function (datum) {
						return !isNaN(datum);
					}
					break;
				case 'integer':
					this.test = function (datum) {
						if (isNaN(datum))
							return false;
						let i = parseInt(datum);		// parseInt("1.2") returns 1 so we need to go further to confirm
						let f = parseFloat(datum);		// the value is an int. So also parseFloat() and check they are
						return i == f;					// the same.
					}
					break;
				default:
					this.error(`Configured with an unrecognized data type. Expected 'string', 'float', 'integer', or 'number' but got '${config.type}'.`);
					break;
			}
		}

		this.rowNumber = 0;
		this.numHeaderRows = 0;
		if (!this.config.numberOfHeaderRows)
			this.warning(`Configured without a 'NumberOfHeaderRows' property. Using ${this.numHeaderRows}.`);
		else if (isNaN(this.config.numberOfHeaderRows))
			this.warning(`Configured with a non-number NumberOfHeaderRows. Got '${this.config.numberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else if (this.config.numberOfHeaderRows < 0)
			this.warning(`Configured with a negative NumberOfHeaderRows. Got '${this.config.numberOfHeaderRows}', using ${this.numHeaderRows}.`);
		else {
			this.numHeaderRows = Math.floor(parseFloat(this.config.numberOfHeaderRows));
			if (!Number.isInteger(parseFloat(this.config.numberOfHeaderRows)))
				this.warning(`Configured with a non-integer NumberOfHeaderRows. Got '${this.config.numberOfHeaderRows}', using ${this.numHeaderRows}.`);
		}

		this.column = undefined;
		if (this.config.column === undefined)
			this.error(`Configured without a 'column' property.`);
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
			this.error(`Configured with a negative column. Got '${this.config.column}'.`);
		else {
			this.column = Math.floor(parseFloat(this.config.column));
			if (!Number.isInteger(parseFloat(this.config.column)))
				this.warning(`Configured with a non-integer column. Got '${this.config.column}', using ${this.column}.`);
		}

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.ReportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.column !== undefined && this.rowNumber >= this.numHeaderRows) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${this.rowNumber} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else if (this.test && !this.test(record[this.column]))	// Is the cell in the column valid?
				this.error(`Row ${this.rowNumber}, Column ${this.column}: Expected a ${this.config.type} but got ${record[this.column]}.`);
		}

		this.rowNumber++;
		return record;
	}
}

module.exports = CheckColumnType;
