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
    constructor(config, tableRule) {
        super(config);
        this.tableRule = tableRule;

        if(!this.tableRule) {
            this.warning(`No rule was supplied to parser`);
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
        throw "not implemented"
    }

    static get Type() {
        return "table_parser";
    }
}

module.exports = TableParserAPI;	// Export this so derived classes can extend it.