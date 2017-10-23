const TableRuleAPI = require("../api/TableRuleAPI");
const ErrorHandlerAPI = require("../api/errorHandlerAPI");

class CheckColumnRegEx extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		if (!config) {
			this.error('No configuration specified.');			// At the moment this does nothing since a config is required for reporting errors.
			return;	// Might as well give up...
		}

		if (!this.config.regex) {
			this.error(`No 'regex' property defined'.`);
			return;
		}
		else {
			const regex = new RegExp(this.config.regex);
			this.exec = function (datum) {
				return regex.exec(datum);
			}
		}

		if(!this.config.newColumn) {
			this.error(`No 'newColumn' name defined.`);
			return;
		}

		this.column = this.getValidatedColumnProperty();
		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config.reportAlways || true;	// Should every occurrence be reported?

		if(this.config.failType === ErrorHandlerAPI.WARNING) {
			this.onFailure = this.warning;
		} else if (this.config.failType === ErrorHandlerAPI.ERROR) {
			this.onFailure = this.error;
		} else {
			this.onFailure = null;
		}
	}

	get processHeaderRows() {
		return true;
	}

	start() {
		// Because of the asynchronous nature of streams this modification of the shared data must be done
		// before the rule starts rather than at the end. Otherwise following rules would start with the unmodified
		// version of the shared data. Not what is desired.

		// Remove the column label from the shared list of column labels.
		if (this.column !== undefined
			&& this.parser
			&& this.parser.config
			&& this.parser.config.columnNames
			&& this.parser.config.columnNames.length != null
			&& this.parser.config.columnNames.length >= this.column) {

			this.newColumnIndex = this.parser.config.columnNames.length;

			this.parser.config.columnNames.push(this.config.newColumn);

		}

	}

	processRecord(record, rowId, isHeaderRow) {

		if(isHeaderRow) {
			record[this.newColumnIndex] = this.config.newColumn;
		} else	if (this.column !== undefined) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${rowId} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			} else if(this.exec) {
				const result = this.exec(record[this.column]);

				if(this.onFailure && !result) {
					this.onFailure(`Row ${rowId}, Column ${this.column}: Expected a match of ${this.config.regex} but got ${record[this.column]}.`);
				}

				if(result) {
					record[this.newColumnIndex] = result[0];
				} else {
					record[this.newColumnIndex] = '';
				}
			}

		}

		return record;
	}


	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'column',
				label: 'Source Column',
				type: 'column',
				minimum: '0',
				tooltip: 'The column to run the regular expression against.'
			},
			{
				name: 'newColumn',
				label: 'New Column Name',
				type: 'string',
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
					ErrorHandlerAPI.WARNING,
					'Nothing'
				]
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({
			failType: 'Nothing'
		});
	}

}

module.exports = CheckColumnRegEx;
