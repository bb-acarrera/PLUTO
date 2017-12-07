const TableRuleAPI = require("../api/TableRuleAPI");
const ErrorHandlerAPI = require("../api/errorHandlerAPI");

class CheckColumnRegEx extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		if (!config) {
			this.error('No configuration specified.');			// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}

		this.checkValidColumnProperty();

		if (!this.config.regex) {
			this.error(`No 'regex' property defined'.`);
			return;
		}
		else {
			const regex = new RegExp(this.config.regex);
			this.test = function (datum) {
				return regex.test(datum);
			}
		}

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?

		if(this.config.failType === ErrorHandlerAPI.WARNING) {
			this.onFailure = this.warning;
		} else {
			this.onFailure = this.error;
		}
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
				this.onFailure(`Row ${rowId}, Column ${this.column}: Expected a match of ${this.config.regex} but got ${record[this.column]}.`, rowId);
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
				tooltip: 'The column to run the regular expression against.'
			},
			{
				name: 'regex',
				label: 'Regular Expression',
				type: 'string',
				tooltip: 'The regular expression to use to validate the given column.'
			},
			{
				name: 'failType',
				label: 'On failure generate: ',
				type: 'choice',
				choices: [
					ErrorHandlerAPI.ERROR,
					ErrorHandlerAPI.WARNING]
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({
			failType: ErrorHandlerAPI.ERROR
		});
	}

	static get Descriptions() {
		return {
			shortDescription: "Verify that values in a column in a CSV file match a regular expression.",
			longDescription: "This rule verifies that the values in a column in a CSV file match a regular expression (RegEx). An error is reported if the column doesn't exist. Depending on the failure type either a warning or error can be reported if the value in a column does not match the regular expression. "
		}
	}

}

module.exports = CheckColumnRegEx;
