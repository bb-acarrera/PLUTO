const TableRuleAPI = require("../../../api/TableRuleAPI");
const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");

class TestRulePassFail extends TableRuleAPI {
	constructor(config) {
		super(config);

		if (!this.config)
			this.error('No configuration specified.');

		if (this.config.processHeaderRows === null)
			this.config.processHeaderRows = true;



	}

	start(parser) {
		this.column = this.getValidatedColumnProperty();
	}

	processRecord(record, rowId) {

		if(record.length > this.column && record[this.column]) {
			const type = record[this.column].trim();

			if(type === ErrorHandlerAPI.ERROR) {
				this.error(`Row ${rowId} has error`);
			}

			if(type === ErrorHandlerAPI.WARNING) {
				this.warning(`Row ${rowId} has warning`);
			}

			if(type === ErrorHandlerAPI.INFO) {
				this.info(`Row ${rowId} has info`);
			}
		}

		return record;
	}


	get processHeaderRows() {
		return this.config.processHeaderRows;
	}

	static get ConfigProperties() {
		return [];
	}

	static get ConfigDefaults() {
		return {};
	}
}

module.exports = TestRulePassFail;
