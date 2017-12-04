const TableRuleAPI = require("../api/TableRuleAPI");

class CheckRowCount extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		this.goodConfig = true;
		this.rowCount = 0;

		if (!this.config) {
			this.error('No configuration specified.');
			this.goodConfig = false;
			return;
		}

		this.minWarningThreshold = this.retrieveProperty("minWarningThreshold");
		this.maxWarningThreshold = this.retrieveProperty("maxWarningThreshold");
		this.minErrorThreshold = this.retrieveProperty("minErrorThreshold");
		this.maxErrorThreshold = this.retrieveProperty("maxErrorThreshold");

		if (this.minWarningThreshold >= this.maxWarningThreshold) {
			this.error(`minWarningThreshold (${this.minWarningThreshold}) must be less than maxWarningThreshold (${this.maxWarningThreshold}).`);
			this.goodConfig = false;
		}

		if (this.minErrorThreshold >= this.maxErrorThreshold) {
			this.error(`minErrorThreshold (${this.minErrorThreshold}) must be less than maxErrorThreshold (${this.maxErrorThreshold}).`);
			this.goodConfig = false;
		}

		if (this.minWarningThreshold >= this.minErrorThreshold) {
			this.error(`minWarningThreshold (${this.minWarningThreshold}) must be less than minErrorThreshold (${this.minErrorThreshold}).`);
			this.goodConfig = false;
		}

		if (this.maxWarningThreshold <= this.maxErrorThreshold) {
			this.error(`maxWarningThreshold (${this.maxWarningThreshold}) must be greater than maxErrorThreshold (${this.maxErrorThreshold}).`);
			this.goodConfig = false;
		}
	}

	retrieveProperty(propName) {
		var prop = this.config[propName];

		if (prop === undefined)
			this.error(`Configured without a '${propName}' property.`);
		else if (isNaN(prop))
			this.error(`Configured with a non-number '${propName}'. Got '${prop}'.`);
		else if (prop < 0)
			this.error(`Configured with a negative '${propName}'. Got '${prop}'.`);
		else if (!Number.isInteger(parseFloat(prop)))
			this.error(`Configured with a non-integer '${propName}'. Got '${prop}'.`);
		else
			this.columns = parseFloat(prop);
	}

	processRecord(record, rowId) {
		this.rowCount++;
		return record;
	}

	finish() {
		if (this.goodConfig) {
			if (this.rowCount < this.minErrorThreshold)
				this.error(`Number of rows (${this.rowCount}) less than error threshold (${this.minErrorThreshold}).`);
			else if (this.rowCount < this.minWarningThreshold)
				this.warning(`Number of rows (${this.rowCount}) less than warning threshold (${this.minWarningThreshold}).`);
			else if (this.rowCount > this.maxErrorThreshold)
				this.error(`Number of rows (${this.rowCount}) greater than error threshold (${this.maxErrorThreshold}).`);
			else if (this.rowCount > this.maxWarningThreshold)
				this.warning(`Number of rows (${this.rowCount}) greater than warning threshold (${this.maxWarningThreshold}).`);
		}
	}

	get processHeaderRows() {
		return false;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'minWarningThreshold',
				type: 'integer',
				label: 'Minimum Number of Data Rows Otherwise Warning',
				minimum: '5',
				tooltip: 'Need at least this many data rows or a warning is issued.'
			},
			{
				name: 'maxWarningThreshold',
				type: 'integer',
				label: 'Maximum Number of Data Rows Otherwise Warning',
				minimum: '25',
				tooltip: 'Need no more than this many data rows or a warning is issued.'
			},
			{
				name: 'minErrorThreshold',
				type: 'integer',
				label: 'Minimum Number of Data Rows Otherwise Error',
				minimum: '10',
				tooltip: 'Need at least this many data rows or an error is issued.'
			},
			{
				name: 'maxErrorThreshold',
				type: 'integer',
				label: 'Maximum Number of Data Rows Otherwise Error',
				minimum: '20',
				tooltip: 'Need no more than this many data rows or an error is issued.'
			}
		]);
	}

	static get ConfigDefaults() {
		return this.appendDefaults({
			minWarningThreshold: 5,
			maxWarningThreshold: 25,
			minErrorThreshold: 10,
			maxErrorThreshold: 20
		});
	}
}

module.exports = CheckRowCount;
