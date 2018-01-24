const TableRuleAPI = require("../api/TableRuleAPI");
const moment = require("moment");

class CheckColumnType extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

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
					};
					break;
				case 'integer':
					this.test = function (datum) {
						if (isNaN(datum))
							return false;
						let i = parseInt(datum);		// parseInt("1.2") returns 1 so we need to go further to confirm
						let f = parseFloat(datum);		// the value is an int. So also parseFloat() and check they are
						return i == f;					// the same.
					};
					break;
				case 'iso_8061_datetime':
					this.test = function (datum) {
						return moment(datum, moment.ISO_8601, true).isValid();
					};
					break;
				default:
					this.error(`Configured with an unrecognized data type. Expected 'string', 'float', 'integer', 'number', or 'iso_8061_datetime' but got '${config.type}'.`);
					break;
			}
		}

		this.checkValidColumnProperty();

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?
	}

	start() {
		this.column = this.getValidatedColumnProperty();
	}

	processRecord(record, rowId) {
		if (this.column !== undefined) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${rowId} has insufficient columns.`, rowId);
					this.badColumnCountReported = true;
				}
			}
			else if (this.test && !this.test(record[this.column]))	// Is the cell in the column valid?
				this.error(`Row ${rowId}, Column ${this.column}: Expected a ${this.config.type} but got ${record[this.column]}.`, rowId);
		}

		return record;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'column',
				label: 'Column',
				type: 'column',
				minimum: '0',
				tooltip: 'The column label to run the regular expression against.'
			},
			{
				name: 'type',
				label: 'Column Type',
				type: 'choice',
				choices: [
					{value:'string', label:'String'},
					{value:'float', label:'Float'},
					{value:'integer', label:'Integer'},
					{value:'iso_8061_datetime', label:'ISO 8601 Datetime'}
				],

				tooltip: 'The expected data type of the given column.'
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({});
	}

	static get Descriptions() {
		return {
			shortDescription: "Verify that values in a column in a CSV file match a particular type.",
			longDescription: "This rule verifies that values in a column in a CSV file are the correct type. Valid types are 'string', 'float', and 'integer'. An error is reported if the column doesn't exist or if a value is not of the specified type.",
			title: "Check Column Type"
		}
	}
}

module.exports = CheckColumnType;
