const TableRuleAPI = require("../api/TableRuleAPI");
const ErrorHandlerAPI = require("../api/errorHandlerAPI");

class AddRegExColumn extends TableRuleAPI {
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

		this.checkValidColumnProperty();

		if(!this.config.newColumn) {
			this.error(`No 'newColumn' name defined.`);
			return;
		}


		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.

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
		this.column = this.getValidatedColumnProperty();

		if(this.newColumnIndex == null && this.parser) {
			this.newColumnIndex = this.parser.addColumn(this.config.newColumn);
		}
	}

	processRecord(record, rowId, isHeaderRow) {

		if(this.newColumnIndex == null) {
			this.newColumnIndex = record.length;
		}

		while(record.length <= this.newColumnIndex) {
			record.push(null);
		}

		if(isHeaderRow) {
			record[this.newColumnIndex] = this.config.newColumn;
		} else	if (this.column !== undefined) {
			if (this.column >= record.length) {	// Does the record have the correct number of columns?
				if (!this.badColumnCountReported) {
					this.error(`Row ${rowId} has insufficient columns.`);
					this.badColumnCountReported = true;
				}
			} else if(this.exec) {
				const result = this.exec(record[this.column]);

				if(result) {
					record[this.newColumnIndex] = result[0];
				} else {

					if(this.onFailure) {
						this.onFailure(`Row ${rowId}, Column ${this.column}: Expected a match of ${this.config.regex} but got ${record[this.column]}.`);
					}

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
				tooltip: 'The name of the new column.'
			},
			{
				name: 'regex',
				label: 'Regular Expression',
				type: 'string',
				tooltip: 'The regular expression to use to generate the new column.'
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

module.exports = AddRegExColumn;
