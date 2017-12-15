const TableParserAPI = require("../api/TableParserAPI");

const fs = require("fs");
const parse = require('csv-parse');
const stringify = require('csv-stringify');
const transform = require('stream-transform');

const DeleteColumn = require('./internal/DeleteInternalColumn');
const AddRowIdColumn = require('./internal/AddRowIdColumn');

const trackingColumnName = '____trackingRowId___internal___';

/**

 */
class CSVParser extends TableParserAPI {
    /**
     * Derived classes must call this from their constructor.
     * @constructor
     * @param config {object} the config object passed into the derived class's constructor.
     * @param tableRuleClass {TableRuleAPI class} the rule class for the parser to execute
     * @param tableRuleConfig {object} the configuration to instantiate an instance of tableRuleClass
     */
    constructor(config, tableRuleClass, tableRuleConfig) {
        super(config, tableRuleClass, tableRuleConfig);

        this.delimiter = this.config.delimiter || ',';
        this.comment = this.config.comment || '';
        this.escape = this.config.escape || '"';
        this.quote = this.config.quote || '"';

        this.post_delimiter = this.config.OutputDelimiter || ',';
        this.post_comment = this.config.OutputComment || '';
        this.post_escape = this.config.OutputEscape || '"';
        this.post_quote = this.config.OutputQuote || '"';

        this.numHeaderRows = this.getValidatedHeaderRows();
	    this.columnRow = this.getValidatedColumnRow();

        if(!this.parserSharedData._internalColumns) {
            this.parserSharedData._internalColumns = [];
        }

        this.summary = {
            processed: 0,
            output: 0
        }

    }

    /**
     * Given the value of a property this validates whether the given value is a valid number of header rows
     * and if so returns it otherwise an error is posted to the log and <code>0</code> is
     * returned.
     * @param {string} headerRowsProperty the value of a config header rows property. If this is <code>undefined</code>
     * then <code>this.config.numHeaderRows</code> is used.
     * @param {string} headerRowsPropertyName the name of the property to use in error messages. Defaults to 'numHeaderRows'.
     * @returns {number|undefined} the number of header rows given by headerRowsProperty or 0 if the value is not valid.
     */
    getValidatedHeaderRows(headerRowsProperty, headerRowsPropertyName) {
        headerRowsProperty = headerRowsProperty == undefined ? this.config.numHeaderRows : headerRowsProperty;
        headerRowsPropertyName = headerRowsPropertyName == undefined ? 'numHeaderRows' : headerRowsPropertyName;

        var result = 0;
        if (!this.config.numHeaderRows)
            this.warning(`Configured without a '${headerRowsPropertyName}' property. Using ${result}.`);
        else if (isNaN(headerRowsProperty))
            this.warning(`Configured with a non-number '${headerRowsPropertyName}'. Got '${headerRowsProperty}', using ${result}.`);
        else if (headerRowsProperty < 0)
            this.warning(`Configured with a negative '${headerRowsPropertyName}'. Got '${headerRowsProperty}', using ${result}.`);
        else {
            result = Math.floor(parseFloat(headerRowsProperty));
            if (!Number.isInteger(parseFloat(headerRowsProperty)))
                this.warning(`Configured with a non-integer '${headerRowsPropertyName}'. Got '${headerRowsProperty}', using ${result}.`);
        }

        return result;
    }

	getValidatedColumnRow(columnRowProperty, columnRowPropertyName) {
		columnRowProperty = columnRowProperty == undefined ? this.config.columnRow : columnRowProperty;
		columnRowPropertyName = columnRowPropertyName == undefined ? 'columnRow' : columnRowPropertyName;

		var result = 0;
		if(columnRowProperty != null) {
			if (isNaN(columnRowProperty))
				this.warning(`Configured with a non-number '${columnRowPropertyName}'. Got '${columnRowProperty}', using ${result}.`);
			else if (columnRowProperty < 0)
				this.warning(`Configured with an invalid '${columnRowPropertyName}'. Got '${columnRowProperty}', using ${result}.`);
			else {
				result = Math.floor(parseFloat(columnRowProperty));
				if (!Number.isInteger(parseFloat(columnRowProperty)))
					this.warning(`Configured with a non-integer '${columnRowPropertyName}'. Got '${columnRowProperty}', using ${result}.`);
			}

			return result;
		}

	}


    /**
     * Process a CSV stream.
     * @param inputStream {stream} the stream to read from.
     * @param outputStream {stream} the stream to write to. (May be null/undefined.)
     * @private
     */
    _processCSV(inputStream, outputStream) {
        const parser = parse(
            {
                delimiter: this.delimiter,
                comment: this.comment,
                escape: this.escape,
                quote: this.quote,
                relax_column_count: true		// Need "relax_column_count" otherwise the parser throws an exception when rows have different number so columns.
                // I'd rather detect it.
            });

        let processHeaderRows = false;

        if(this.tableRule) {
            processHeaderRows = this.tableRule.processHeaderRows;
        }
        let rowNumber = 1;
        let rowHeaderOffset = this.numHeaderRows + 1;
        let firstRow = true;


        // This CSV Transformer is used to call the processRecord() method above.
	    function processRow(record, isHeaderRow, callback, rowNumber) {

            if(this.config.__state && this.config.__state.sharedData && this.config.__state.sharedData.abort) {
                callback(null, null);
                return;
            }

            let response = record;

            let rowId = rowNumber;

            if(this.tableRule && (!isHeaderRow || processHeaderRows)) {

                if(this.parserSharedData.rowIdColumnIndex != null && record.length > this.parserSharedData.rowIdColumnIndex) {
                    rowId = record[this.parserSharedData.rowIdColumnIndex];
                }

                response = this.tableRule.processRecordWrapper(record, rowId, isHeaderRow);

            }

            if(response instanceof Promise) {
                response.then((result) => {
                    callback(null, result);
                    if(result) {
                        this.summary.output += 1;
                    }

                }, () => {
                    //rejected for some reason that should have logged
                    callback(null, response);
                }).catch(() => {
                    callback(null, response);
                })
            } else {

                callback(null, response);
                this.summary.output += 1;
            }
        }

        function deferredProcessRow(record, isHeaderRow, callback, rowNumber) {
            return () => {
                processRow.call(this, record, isHeaderRow, callback, rowNumber)
            }
        }

        let preStartRows = [];

        const transformer = transform((record, callback) => {

            this.summary.processed += 1;

            let isHeaderRow = rowNumber < rowHeaderOffset;

            if(isHeaderRow && !this.parserSharedData.columnNames && this.columnRow == rowNumber) {
                this.parserSharedData.columnNames = [];

                record.forEach((column) => {
                    this.parserSharedData.columnNames.push(column);
                })

            } else if(!isHeaderRow && !this.parserSharedData.columnNames) {

                if(this.config.columnNames && this.config.columnNames.length > 0) {
                    this.parserSharedData.columnNames = this.config.columnNames
                } else {
                    this.parserSharedData.columnNames = [];
                    while(this.parserSharedData.columnNames.length < record.length) {
                        this.parserSharedData.columnNames.push(this.parserSharedData.columnNames.length);
                    }
                }
            }

            if(firstRow && this.parserSharedData.columnNames) {
                firstRow = false;
                if(this.tableRule) {
                    this.tableRule.start(this);
                }

                preStartRows.forEach((row) => {
                    row();
                });

                processRow.call(this, record, isHeaderRow, callback, rowNumber);

            } else if(!this.parserSharedData.columnNames) {
                preStartRows.push(deferredProcessRow.call(this, record, isHeaderRow, callback, rowNumber));
            } else {
                processRow.call(this, record, isHeaderRow, callback, rowNumber);
            }

            rowNumber++;
        });

        if(this.tableRule) {
            transformer.once("finish", () => {
                this.tableRule.finish();	// Finished so let the derived class know.
            });
        }

        const that = this; //need this so we have context of the pipe that's failing on 'this'
        function handleError(e) {
            that.error('Error processing csv: ' + e);

            if(outputStream) {
                outputStream.end(e);
            } else {
                transformer.destroy(e);
            }

        }

        let pipeline = inputStream.pipe(parser).on('error', handleError)
            .pipe(transformer).on('error', handleError);

        if (outputStream) {
            // Only need to stringify if actually outputting anything.
            const stringifier = stringify({
                delimiter: this.post_delimiter,
                comment: this.post_comment,
                escape: this.post_escape,
                quote: this.post_quote,
                relax_column_count: true		// Need "relax_column_count" otherwise the parser throws an exception when rows have different number so columns.
                // I'd rather detect it.
            });

            pipeline = pipeline.pipe(stringifier).on('error', handleError)
                .pipe(outputStream).on('error', handleError);
        }
    }

    run() {
        this._processCSV(this.inputStream, this.outputStream);
        return this.asStream(this.outputStream);
    }

    getSetupRule() {
        if(this.parserSharedData && !this.parserSharedData.CSVParserSetupAdded) {
            const config = Object.assign({}, this.config, {
                newColumn : trackingColumnName
            });

            this.parserSharedData.CSVParserSetupAdded = true;

            return new CSVParser(this.config, AddRowIdColumn, config);
        }
    }

    getCleanupRule() {
        if(this.parserSharedData && !this.parserSharedData.CSVParserCleanupAdded) {
            const config = Object.assign({}, this.config, {
                column : trackingColumnName
            });

            this.parserSharedData.CSVParserCleanupAdded = true;

            return new CSVParser(this.config, DeleteColumn, config);
        }
    }


    get internalColumns() {
        return this.parserSharedData._internalColumns;
    }

    addInternalColumn(columnName) {

        let newColumnIndex = this.addColumn(columnName);

        if (newColumnIndex != null) {
            this.parserSharedData._internalColumns.push({columnName: columnName, index: newColumnIndex});
        }

        return newColumnIndex;
    }

    removeInternalColumn(columnIndex) {
        this.removeColumn(columnIndex);

        let index = this.parserSharedData._internalColumns.length - 1;
        while (index >= 0) {
            if (this.parserSharedData._internalColumns[index].index === columnIndex) {
                this.parserSharedData._internalColumns.splice(index, 1);
            }
            index -= 1;
        }
    }

    static get Type() {
        return "table_parser";
    }

    static get ConfigProperties() {
        return [
            {
                name: 'columnNames',
                label: 'Column names',
                type: 'list',
                tooltip: 'The names of the columns; used for column selection in rules',
				validations: [
					{
						length: {
							min: 1
						}
					}
				]
            },
            {
                name: 'columnRow',
                label: 'Row number which contains the column names',
                type: 'integer',
                tooltip: 'The row index where the column names are. Usually the first row (1)',
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
                name: 'numHeaderRows',
                label: 'Number of Header Rows',
                type: 'integer',
                minimum: '0',
                tooltip: 'The number of rows that contain meta-data (e.g. column names) and not data.',
				validations: [
					{
						number: {
							gte: 0
						}
					}
				]
            },
            {
                name: 'delimiter',
                label: 'Delimiter',
                type: 'choice',
                tooltip: 'Field delimiter of the file. One character only. Defaults to \',\' (comma)',
                choices: [
                    {value:',', label:', (comma)'},
                    {value:'\t', label:'tab'},
                    {value:'|', label:'| (bar)'},
                    {value:' ', label:'space'}
                ]
            },
            {
                name: 'comment',
                label: 'Comment character',
                type: 'string',
                tooltip: 'Treat all the characters after this one as a comment. Defaults to \'\' (disabled)'
            },
            {
                name: 'escape',
                label: 'Escape character',
                type: 'string',
                tooltip: 'The string escape character. One character only. Defaults to \'"\' (double quote)'
            },
            {
                name: 'quote',
                label: 'Quote character',
                type: 'string',
                tooltip: 'Optional character surrounding a field. One character only. Disabled if empty. Defaults to \'"\' (double quote)'
            }
        ];
    }


    static get ConfigDefaults() {
        return {
            numHeaderRows: 1,
            columnRow: 1,
            delimiter: ',',
            comment: '',
            escape: '"',
            quote: '"'
        };
    }

}

module.exports = CSVParser;	// Export this so derived classes can extend it.
