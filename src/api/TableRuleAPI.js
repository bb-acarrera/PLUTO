const ParserRuleAPI = require('./ParserRuleAPI');
const ErrorHandlerAPI = require('./errorHandlerAPI');
const BaseRuleAPI = require('./BaseRuleAPI');

/**
 * This API class is used to describe the interface to rule operations. This base class can be used by rules that
 * interact with operators.
 */
class TableRuleAPI extends ParserRuleAPI {

    /**
     * The base constructor. This simply sets <code>this.config</code> to the passed in configuration object. This config object
     * will be the rule's individual configuration (if any) and additionally contain <code>RootDirectory</code> which defaults to
     * the application's root directory if not set, <code>TempDirectory</code> which defaults to the application's temporary
     * directory if not set, <code>OutputEncoding</code> which is set to the rule's Encoding if set or to the ruleset's Encoding
     * if set, and <code>utf8</code> if none are set, and <code>Encoding</code> which is set to the input file's encoding. (Note
     * the distinction between <code>Encoding</code> and <code>OutputEncoding</code>. <code>Encoding</code> is set to the source file's encoding and
     * <code>OutputEncoding</code> is set to the encoding of the file generated by the rule. In general these would be the same
     * but rule's may want to switch one uncommon encoding for another more common one.)
     * @param localConfig {object} the rule's configuration as defined in the ruleset file or a standalone config file.
     */
    constructor(localConfig, parser) {
        super(localConfig);
        this.parser = parser;

        this.excludeRow = {};

        if(this.config && this.config.onError) {
            this.excludeRecordOnError = this.config.onError == 'excludeRow';
        } else {
            this.excludeRecordOnError = false;
        }
    }

    /**
     * Derived classes should override this method if they need to do anything before the processing of the data starts.
     * <br/>Note that rules that use streams and modify the metadata, because of their asynchronous nature, should do so
     * in a <code>start()</code> method. Modifying the metdata any later could mean that the changes are not
     * applied until after the next rule needs the changes. However rules that use data objects or files are safe
     * to modify metadata at any point, in the <code>start()</code> or <code>finish()</code> methods since these
     * rules would run synchronously.
     * @param tableParser {TableParserAPI} the parser for this rule
     */
    start(tableParser) {
        // Do any pre-processing.
    }

    /**
     * Derived classes should override this method if they need to do anything after the processing of records is complete.
     *
     */
    finish() {
        // Do any post-processing.
    }

    /**
     * Does pre-processing to pre the record to be processed, calls processRecord
     * @param record {array} one record from the csv file.
     * @param rowId {object | number} row indicator, usually the row number
     * @param isHeaderRow {boolean} indicates that the row is a header row (when requested via processHeaderRows)
     * @returns {array} a record, either the original one if no modifications were carried out or a new one.
     */
    processRecordWrapper(record, rowId, isHeaderRow, rowNumber) {

        const response = this.processRecord(record, rowId, isHeaderRow, rowNumber);

        if(response instanceof Promise) {
            return new Promise((resolve, reject) => {
               response.then(
                   (result) => {

                       if(this.excludeRow[rowId]) {
                           resolve(null);
                       } else {
                           resolve(result);
                       }

                   },
                   () => {
                        reject();
                   });
            });
        }

        if(this.excludeRow[rowId]) {
            return null;
        }

        return response;
    }

    /**
     * Derived classes should implement this method to process individual records.
     * @param record {array} one record from the csv file.
     * @param rowId {object | number} row indicator, usually the row number
     * @param isHeaderRow {boolean} indicates that the row is a header row (when requested via processHeaderRows)
     * @returns {array} a record, either the original one if no modifications were carried out or a new one.
     */
    processRecord(record, rowId, isHeaderRow = false) {
        // Process the record and return the new record.
        return record;
    }


    /**
     * Overrides errorHandlerAPI method so when dropping rows processing isn't aborted, and error is converted to warning
     * @param {string} level the level of the log. One of {@link Validator.ERROR}, {@link Validator.WARNING}, or {@link Validator.INFO}.
     * If null or undefined
     * then {@link Validator.INFO} is assumed.
     * @param problemFileName {string} the name of the file causing the log to be generated. (ex. the rule's filename)
     * @param ruleID the ID of the rule raising the log report or undefined if raised by some file other than a rule.
     * @param problemDescription {string} a description of the problem encountered.
     * @param dataItemId {string} or {number} the unique id of the item in a dataset being processed, null if NA
     * @private
     */
    log(level, problemFileName, ruleID, problemDescription, dataItemId) {
        if(dataItemId && this.excludeRecordOnError && level === ErrorHandlerAPI.ERROR) {
            level = ErrorHandlerAPI.DROPPED;
            this.excludeRow[dataItemId] = true;
        }

        return super.log(level, problemFileName, ruleID, problemDescription, dataItemId);
    }

    /**
     * Derived classes can implement this method to return true if they need the header rows
     * @returns {boolean} true if header rows should be passed to the processRecord method
     */
    get processHeaderRows() {
        return false;
    }

    /**
     * Append config properties to a supplied list
     * @param inProperties the list of properties to append to
     * @returns {Array}
     */
    static appendConfigProperties(inProperties) {

        const properties = [
            {
                name: 'onError',
                label: 'Action on error: ',
                type: 'choice',
                choices: [
                    'abort',
                    'excludeRow']
            }
        ];

        let props;

        if(inProperties) {
            props = inProperties.concat(properties);
        } else {
            props = [].concat(properties);
        }

        return BaseRuleAPI.appendConfigProperties(props);
    }

    /**
     * Append config defaults to a supplied list
     * @param inDefaults the defaults to append to
     * @returns {Object}
     */
    static appendDefaults(inDefaults) {

        const defaults = {
            onError: 'abort'
        };

        let defs;

        if(inDefaults) {
            defs = Object.assign({}, inDefaults, defaults);
        } else {
            defs = Object.assign({}, defaults);
        }

        return BaseRuleAPI.appendDefaults(defs);
    }

    static get Type() {
        return "table_rule";
    }

    static get Parser() {
        return "table_parser";
    }

    /**
     * Given the value of a property this validates whether a valid column property was supplied
     * @param {string} propertyValue the value of a config column property. If this is <code>undefined</code> then
     * <code>this.config.column</code> is used.
     * @param {string} propertyName the name of the property - used in error messages. Defaults to 'column' if not set.
     * @returns {boolean} property OK
     */
    checkValidColumnProperty(propertyValue, propertyName) {
        propertyValue = propertyValue == undefined ? this.config.column : propertyValue;
        propertyName = propertyName == undefined ? 'column' : propertyName;

        if (propertyValue == null) {
            this.error(`Configured without a '${propertyName}' property.`);
            return false;
        }

        return true;
    }

    /**
     * Given the value of a property this validates whether the given value is a column label or column number
     * and if so returns the column number otherwise an error is posted to the log and <code>undefined</code> is
     * returned.
     * @param {string} propertyValue the value of a config column property. If this is <code>undefined</code> then
     * <code>this.config.column</code> is used.
     * @param {string} propertyName the name of the property - used in error messages. Defaults to 'column' if not set.
     * @returns {number|undefined} the column number represented by the propertyValue or undefined if the value is not valid.
     */
    getValidatedColumnProperty(propertyValue, propertyName) {
        propertyValue = propertyValue == undefined ? this.config.column : propertyValue;
        propertyName = propertyName == undefined ? 'column' : propertyName;

        var result = undefined;
        if (propertyValue != null) {

            if (isNaN(propertyValue)) {
                if (this.parser) {
                    result = this.parser.getValidatedColumnProperty(propertyValue, propertyName);
                } else {
                    this.error(`Configured with a non-number '${propertyName}'. Got '${propertyValue}'.`);
                }

            }
            else if (propertyValue < 0)
                this.error(`Configured with a negative '${propertyName}'. Got '${propertyValue}'.`);
            else {
                result = Math.floor(parseFloat(propertyValue));
                if (!Number.isInteger(parseFloat(propertyValue)))
                    this.warning(`Configured with a non-integer '${propertyName}'. Got '${propertyValue}', using ${result}.`);
            }
        }
        return result;

    }
}

module.exports = TableRuleAPI;	// Export this so derived classes can extend it.

