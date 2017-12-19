const TableRuleAPI = require("../api/TableRuleAPI");

class CheckRowCount extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		this.rowCount = 0;

		if (!config) {
			this.error('No configuration specified.');
			return;
		}

		this.minWarningThreshold = this.retrieveProperty("minWarningThreshold");
		this.maxWarningThreshold = this.retrieveProperty("maxWarningThreshold");
		this.minErrorThreshold = this.retrieveProperty("minErrorThreshold");
		this.maxErrorThreshold = this.retrieveProperty("maxErrorThreshold");

		if (this.minWarningThreshold && this.maxWarningThreshold && this.minWarningThreshold >= this.maxWarningThreshold) {
			this.error(`minWarningThreshold (${this.minWarningThreshold}) must be less than maxWarningThreshold (${this.maxWarningThreshold}).`);
		}

		if (this.minErrorThreshold && this.maxErrorThreshold && this.minErrorThreshold >= this.maxErrorThreshold) {
			this.error(`minErrorThreshold (${this.minErrorThreshold}) must be less than maxErrorThreshold (${this.maxErrorThreshold}).`);
		}

		if (this.minWarningThreshold && this.minErrorThreshold && this.minWarningThreshold <= this.minErrorThreshold) {
			this.error(`minWarningThreshold (${this.minWarningThreshold}) must be greater than minErrorThreshold (${this.minErrorThreshold}).`);
		}

		if (this.maxWarningThreshold && this.maxErrorThreshold && this.maxWarningThreshold >= this.maxErrorThreshold) {
			this.error(`maxWarningThreshold (${this.maxWarningThreshold}) must be less than maxErrorThreshold (${this.maxErrorThreshold}).`);
		}

		if (!this.minErrorThreshold && !this.minWarningThreshold && !this.maxErrorThreshold && !this.maxWarningThreshold) {
			this.warning('Configured without any valid threshold properties.');
		}
	}

	retrieveProperty(propName) {
		var prop = this.config[propName];

		if (prop === undefined)
			return undefined;
		else if (isNaN(prop))
			this.error(`Configured with a non-number '${propName}'. Got '${prop}'.`);
		else if (prop < 0)
			this.error(`Configured with a negative '${propName}'. Got '${prop}'.`);
		else if (!Number.isInteger(parseFloat(prop)))
			this.error(`Configured with a non-integer '${propName}'. Got '${prop}'.`);
		else
			return parseFloat(prop);

		return undefined;
	}

	processRecord(record, rowId) {
		this.rowCount++;
		return record;
	}

	finish() {
		if (this.minErrorThreshold && this.rowCount < this.minErrorThreshold)
			this.error(`Number of rows (${this.rowCount}) less than error threshold (${this.minErrorThreshold}).`);
		else if (this.minWarningThreshold && this.rowCount < this.minWarningThreshold)
			this.warning(`Number of rows (${this.rowCount}) less than warning threshold (${this.minWarningThreshold}).`);
		else if (this.maxErrorThreshold && this.rowCount > this.maxErrorThreshold)
			this.error(`Number of rows (${this.rowCount}) greater than error threshold (${this.maxErrorThreshold}).`);
		else if (this.maxWarningThreshold && this.rowCount > this.maxWarningThreshold)
			this.warning(`Number of rows (${this.rowCount}) greater than warning threshold (${this.maxWarningThreshold}).`);
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
				minimum: '10',
				tooltip: 'Need at least this many data rows or a warning is issued.',
				validations: [
					{
						number: {
							gte: 0,
							allowBlank: true
						}
					}
				]
			},
			{
				name: 'maxWarningThreshold',
				type: 'integer',
				label: 'Maximum Number of Data Rows Otherwise Warning',
				minimum: '20',
				tooltip: 'Need no more than this many data rows or a warning is issued.',
				validations: [
					{
						number: {
							gte: 0,
							allowBlank: true
						}
					}
				]
			},
			{
				name: 'minErrorThreshold',
				type: 'integer',
				label: 'Minimum Number of Data Rows Otherwise Error',
				minimum: '5',
				tooltip: 'Need at least this many data rows or an error is issued.',
				validations: [
					{
						number: {
							gte: 0,
							allowBlank: true
						}
					}
				]
			},
			{
				name: 'maxErrorThreshold',
				type: 'integer',
				label: 'Maximum Number of Data Rows Otherwise Error',
				minimum: '25',
				tooltip: 'Need no more than this many data rows or an error is issued.',
				validations: [
					{
						number: {
							gte: 0,
							allowBlank: true
						}
					}
				]
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

	static get Descriptions() {
		return {
			shortDescription: "Verify that a CSV file has the required number of rows.",
			longDescription: "This rule verifies that a CSV file has the required number of data rows. (Header rows are not included in the count.) Four configuration properties allow you to set thresholds for warnings and errors. If a property is set to zero or not set it is ignored so it is possible to configure for reporting only errors, only warnings, or both. Thresholds are exclusive, so a minimum threshold of 2, for example, will report an error or warning if the number of rows is less than 2."
		}
	}
}

module.exports = CheckRowCount;
