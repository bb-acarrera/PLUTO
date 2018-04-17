const ParserAPI = require("../api/ParserAPI");

/**

 */
class TableParserAPI extends ParserAPI {

    /**
     * Derived classes must call this from their constructor.
     * @constructor
     * @param config {object} the config object passed into the derived class's constructor.
     * @param wrappedRule {TableRuleAPI} the rule for the parser to execute
     * @param wrappedRuleConfig {object} the config object for the wrappedRule
     */
    constructor(config, wrappedRule, wrappedRuleConfig) {
        super(config, wrappedRule, wrappedRuleConfig);

        if(!this.parserSharedData._internalColumns) {
            this.parserSharedData._internalColumns = [];
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

            if(!this.parserSharedData.columnChanges) {
                this.parserSharedData.columnChanges = [];
            }

            this.parserSharedData.columnChanges.push({add:columnName, index:newColumnIndex});

        }



        return newColumnIndex;
    }

    removeColumn(columnIndex) {
        let columnName = null;
        if(this.parserSharedData.columnNames
            && this.parserSharedData.columnNames.length > columnIndex) {

            columnName =  this.parserSharedData.columnNames[columnIndex];

            this.parserSharedData.columnNames.splice(columnIndex, 1);

            if(!this.parserSharedData.columnChanges) {
                this.parserSharedData.columnChanges = [];
            }

            this.parserSharedData.columnChanges.push({remove:columnName, index:columnIndex});
        }

    }

    /**
     * The list of columns added by the parser
     * @returns {Array}
     */
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