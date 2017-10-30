const TableRuleAPI = require("../../../api/TableRuleAPI");
const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");

class RuleCountRows extends TableRuleAPI {
	constructor(config) {
		super(config);

		if (!this.config)
			this.error('No configuration specified.');

	}

	start() {
		this.rowCount = 0;
	}

	processRecord(record, rowId) {

		this.rowCount += 1;

		return record;
	}


	finish() {
		if(this.rowCount != this.config.rowCount) {
			this.error(`Wrong number of rows. Expected ${this.config.rowCount} but got ${this.rowCount}`);
		}
	}

	get processHeaderRows() {
		return true;
	}

	static get ConfigProperties() {
		return [];
	}

	static get ConfigDefaults() {
		return {};
	}
}

module.exports = RuleCountRows;
