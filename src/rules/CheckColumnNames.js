const TableRuleAPI = require("../api/TableRuleAPI");
const ErrorHandlerAPI = require("../api/errorHandlerAPI");



class CheckColumnNames extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		this.columns = undefined;
		if (!this.config)
			this.error('No configuration specified.');

		this.checkedColumns = false;

		if(this.config.missingColumns === ErrorHandlerAPI.WARNING) {
			this.onMissingColumnsFailure = this.warning;
		} else if (this.config.missingColumns === ErrorHandlerAPI.ERROR) {
			this.onMissingColumnsFailure = this.error;
		} else {
			this.onMissingColumnsFailure = null;
		}

		if(this.config.extraColumns === ErrorHandlerAPI.WARNING) {
			this.onExtraColumnsFailure = this.warning;
		} else if (this.config.extraColumns === ErrorHandlerAPI.ERROR) {
			this.onExtraColumnsFailure = this.error;
		} else {
			this.onExtraColumnsFailure = null;
		}

		if(this.config.orderMatch === ErrorHandlerAPI.WARNING) {
			this.onOrderMatchFailure = this.warning;
		} else if (this.config.orderMatch === ErrorHandlerAPI.ERROR) {
			this.onOrderMatchFailure = this.error;
		} else {
			this.onOrderMatchFailure = null;
		}

	}

	processRecord(record, rowId, isHeaderRow) {

		if(this.checkedColumns || !this.parser || !this.parser.config) {
			return record;
		}

		if(this.parser.parserSharedData && this.parser.parserSharedData.columnNames) {
			const psd = this.parser.parserSharedData;

			const actualColumns = psd.columnNames;

			const columnChanges = psd.columnChanges || [];

			if(this.parser.config.columnNames) {
				const configuredColumns = this.parser.config.columnNames.slice(); //make a copy

				//apply the added and removed columns to the configured list
				columnChanges.forEach((change) => {
					if(change.add) {
						configuredColumns.push(change.add)
					} else if(change.remove) {
						configuredColumns.splice(change.index, 1);
					}
				});

				if(this.onMissingColumnsFailure) { //check for missing columns
					configuredColumns.forEach((columnName) => {
						if(actualColumns.indexOf(columnName) < 0) {
							this.onMissingColumnsFailure(`Missing column ${columnName}`);
						}
					});
				}

				if(this.onExtraColumnsFailure) { //check for extra columns
					actualColumns.forEach((columnName) => {
						if(configuredColumns.indexOf(columnName) < 0) {
							this.onExtraColumnsFailure(`Extra column ${columnName}`);
						}
					});
				}

				if(this.onOrderMatchFailure) { //check for extra columns
					let i;
					for(i = 0; i < configuredColumns.length; i++) {

						if(actualColumns.length <= i || actualColumns[i] !== configuredColumns[i]) {
							this.onOrderMatchFailure(`Order match failed. Expected "${configuredColumns.toString()}" but got "${actualColumns.toString()}"`);
							break;
						}

					}

					actualColumns.forEach((columnName) => {
						if(configuredColumns.indexOf(columnName) < 0) {
							this.onExtraColumnsFailure(`Missing column ${columnName}`);
						}
					});
				}
			} else {
				this.warning('No column names specified in the parser configuration');
			}

			this.checkedColumns = true;
		}

		return record;
	}


	get processHeaderRows() {
		return true;
	}

	static get ConfigProperties() {
		return [
			{
				name: 'missingColumns',
				type: 'choice',
				label: "If there are missing columns",
				choices: [
					{value:ErrorHandlerAPI.ERROR, label:ErrorHandlerAPI.ERROR},
					{value:ErrorHandlerAPI.WARNING, label:ErrorHandlerAPI.WARNING},
					{value:'ignore', label:'Ignore'}],
				tooltip: "What to do if columns specified in the parsers column names are missing"
			},
			{
				name: 'extraColumns',
				type: 'choice',
				label: "If there are extra columns",
				choices: [
					{value:ErrorHandlerAPI.ERROR, label:ErrorHandlerAPI.ERROR},
					{value:ErrorHandlerAPI.WARNING, label:ErrorHandlerAPI.WARNING},
					{value:'ignore', label:'Ignore'}],
				tooltip: "What to do if there are columns not specified in the parsers column names"
			},
			{
				name: 'orderMatch',
				type: 'choice',
				label: "If column order isn't the same",
				choices: [
					{value:ErrorHandlerAPI.ERROR, label:ErrorHandlerAPI.ERROR},
					{value:ErrorHandlerAPI.WARNING, label:ErrorHandlerAPI.WARNING},
					{value:'ignore', label:'Ignore'}],
				tooltip: "What to do if the order of the columns doesn't match what is specified in the parser's column names"
			}
		];
	}

	static get ConfigDefaults() {
		return {
			missingColumns: ErrorHandlerAPI.ERROR,
			extraColumns: ErrorHandlerAPI.WARNING,
			orderMatch: 'ignore'
		};
	}
}

module.exports = CheckColumnNames;
