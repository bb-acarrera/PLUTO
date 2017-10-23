const TableParserAPI = require("../api/TableParserAPI");

const fs = require("fs");
const parse = require('csv-parse');
const stringify = require('csv-stringify');
const transform = require('stream-transform');

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


        // This CSV Transformer is used to call the processRecord() method above.
        const transformer = transform(record => {

            if(this.config.sharedData && this.config.sharedData.abort) {
                return null;
            }

            let response = record;
            let isHeaderRow = rowNumber < rowHeaderOffset;

            this.tableRule.resetLastCheckCounts();

            if (this.tableRule && (!isHeaderRow || processHeaderRows)) {
                response = this.tableRule.processRecordWrapper(record, rowNumber, isHeaderRow);
            }

            rowNumber++;

            if(this.tableRule.lastCheckHadErrors() && this.tableRule.excludeRecordOnError) {
                return null;
            }

            return response;
        });

        if(this.tableRule) {
            transformer.once("finish", () => {
                this.tableRule.finish();	// Finished so let the derived class know.
            });

            this.tableRule.start(this);
        }

        const that = this; //need this so we have context of the pipe that's failing on 'this'
        function handleError(e) {
            that.error('Error processing csv: ' + e);
            outputStream.end();
        }

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
            inputStream.pipe(parser).on('error', handleError)
                .pipe(transformer).on('error', handleError)
                .pipe(stringifier).on('error', handleError)
                .pipe(outputStream).on('error', handleError);
        }
        else
            inputStream.pipe(parser).on('error', handleError)
                .pipe(transformer).on('error', handleError);
    }

    run() {
        this._processCSV(this.inputStream, this.outputStream);
        return this.asStream(this.outputStream);
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
                tooltip: 'The names of the columns; used for column selection in rules'
            },
            {
                name: 'numHeaderRows',
                label: 'Number of Header Rows',
                type: 'integer',
                minimum: '0',
                tooltip: 'The expected number of rows making up the input file header.'
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
            delimiter: ',',
            comment: '',
            escape: '"',
            quote: '"'
        };
    }

}

module.exports = CSVParser;	// Export this so derived classes can extend it.
