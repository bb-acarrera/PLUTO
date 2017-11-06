const RuleAPI = require("../api/RuleAPI");

/**

 */
class TableParserAPI extends RuleAPI {

    /**
     * Derived classes must call this from their constructor.
     * @constructor
     * @param config {object} the config object passed into the derived class's constructor.
     * @param tableRule {TableRuleAPI} the rule for the parser to execute
     */
    constructor(config, tableRule, tableRuleConfig) {
        super(config);

        if(this.config.__state && this.config.__state.sharedData) {
            if (!this.config.__state.sharedData.Parser) {
                this.config.__state.sharedData.Parser = { columnNames: this.config.columnNames };
            }


            this.parserSharedData = this.config.__state.sharedData.Parser
        } else {
            this.parserSharedData = {};
        }

        if(!tableRule) {
            this.warning(`No rule was supplied to parser`);
        }

        if(tableRule instanceof Function) {
            this.tableRule = new tableRule(tableRuleConfig, this);
        } else {
            this.tableRule = tableRule;
        }



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

        var result = undefined;
        if (propertyValue === undefined)
            this.error(`Configured without a '${propertyName}' property.`);
        else if (isNaN(propertyValue)) {
            if (this.parserSharedData.columnNames) {
                let columnLabels = this.parserSharedData.columnNames;
                if (columnLabels.length == null) {
                    this.error(`Shared 'columnLabels' is not an array.`);
                    return result;
                }
                else if (columnLabels.length == 0) {
                    this.error(`Shared 'columnLabels' has no content.`);
                    return result;
                }

                // Found a column label not index.
                let index = columnLabels.indexOf(propertyValue);
                if (index < 0)
                    this.error(`Configured with a column label '${propertyValue}' that is not in columnLabels.`);
                else
                    result = index;
            }
            else
                this.error(`Configured with a non-number '${propertyName}'. Got '${propertyValue}'.`);
        }
        else if (propertyValue < 0)
            this.error(`Configured with a negative '${propertyName}'. Got '${propertyValue}'.`);
        else {
            result = Math.floor(parseFloat(propertyValue));
            if (!Number.isInteger(parseFloat(propertyValue)))
                this.warning(`Configured with a non-integer '${propertyName}'. Got '${propertyValue}', using ${result}.`);
        }
        return result;
    }

    addColumn(columnName) {

        let newColumnIndex = null;

        if( this.parserSharedData.columnNames
            && this.parserSharedData.columnNames.length != null) {

            newColumnIndex = this.parserSharedData.columnNames.length;

            this.parserSharedData.columnNames.push(columnName);
        }

        return newColumnIndex;
    }

    removeColumn(columnIndex) {
        if(this.parserSharedData.columnNames
            && this.parserSharedData.columnNames.length != null
            && this.parserSharedData.columnNames.length >= this.column) {

            this.parserSharedData.columnNames.splice(columnIndex, 1);
        }

    }

	/**
	 * The list of columns added by the parser
     * @returns {Array}
     */
    get internalColumns() {
        return [];
    }

    /**
     * The rule type.  Used by parser rules to determine if there is a match on the required type.
     * @returns {string}
     * @constructor
     */
    static get Type() {
        return "table_parser";
    }

}

module.exports = TableParserAPI;	// Export this so derived classes can extend it.