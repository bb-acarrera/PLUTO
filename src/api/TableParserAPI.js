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
     * The rule type.  Used by parser rules to determine if there is a match on the required type.
     * @returns {string}
     * @constructor
     */
    static get Type() {
        return "table_parser";
    }
}

module.exports = TableParserAPI;	// Export this so derived classes can extend it.