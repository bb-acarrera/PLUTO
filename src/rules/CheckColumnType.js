const TableRuleAPI = require("../api/TableRuleAPI");

class CheckColumnType extends TableRuleAPI {
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

		this.column = this.getValidatedColumnProperty();
		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?
	}

	processRecord(record, rowId) {
		if (this.column !== undefined) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${rowId} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			}
			else if (this.test && !this.test(record[this.column]))	// Is the cell in the column valid?
				this.error(`Row ${rowId}, Column ${this.column}: Expected a ${this.config.type} but got ${record[this.column]}.`);
		}

		return record;
	}

	static get ConfigProperties() {
		return [
			{
				name: 'column',
				label: 'Column',
				type: 'column',
				tooltip: 'The column label to run the regular expression against.'
			},
			{
				name: 'type',
				label: 'Column Type',
				type: 'choice',
				choices: [
					'string',
					'float',
					'integer',
					'number'
				],
				tooltip: 'The expected data type of the given column.'
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
			reportAlways: false
		};
	}
}

module.exports = CheckColumnType;
