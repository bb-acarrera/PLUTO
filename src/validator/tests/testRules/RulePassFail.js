const TableRuleAPI = require("../../../api/TableRuleAPI");

class TestRulePassFail extends TableRuleAPI {
	constructor(config) {
		super(config);

		this.columns = undefined;
		if (!this.config)
			this.error('No configuration specified.');

		if (this.config.processHeaderRows === null)
			this.config.processHeaderRows = true;



	}

	start(parser) {
		this.parser = parser;
	}

	processRecord(record, rowId) {

		if(this.config.rows) {
			if(this.config.rows[rowId] === 'error') {
				this.error(`Row ${rowId} has error`);
			}

			if(this.config.rows[rowId] === 'warning') {
				this.warning(`Row ${rowId} has warning`);
			}

			if(this.config.rows[rowId] === 'info') {
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
