const TableRuleAPI = require("../../api/TableRuleAPI");

/* internal rule used by the CSVParser, do not add to the manifest */

class AddRowIdColumn extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

	}

	get processHeaderRows() {
		return true;
	}

	start() {

		if(this.parser && this.parser.addInternalColumn) {
			this.newColumnIndex = this.parser.addInternalColumn(this.config.newColumn);
			this.parser.parserSharedData.rowIdColumnIndex = this.newColumnIndex;
		}

		this.originalRowLength = -1;

	}

	processRecord(record, rowId, isHeaderRow, rowNumber) {

		if(this.newColumnIndex == null) {
			this.newColumnIndex = record.length;
			this.parser.parserSharedData.rowIdColumnIndex = this.newColumnIndex;
		}

		if(this.originalRowLength < 0) {
			this.originalRowLength = record.length;
		} else if(record.length != this.originalRowLength) {
			//row count is different between the first row and this row
			this.error(`Row ${rowNumber} has ${record.length} columns but the first row had ${this.originalRowLength} columns.`, rowNumber);
		}

		while(record.length <= this.newColumnIndex) {
			record.push(null);
		}

		record[this.newColumnIndex] = rowNumber;

		return record;
	}


	static get ConfigProperties() {
		return this.appendConfigProperties([

			{
				name: 'newColumn',
				label: 'New Column Name',
				type: 'string',
				tooltip: 'The name of the new column.'
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({});
	}

}

module.exports = AddRowIdColumn;
