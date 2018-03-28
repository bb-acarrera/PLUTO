const RuleAPI = require("../api/RuleAPI");

/**

 */
class ParserAPI extends RuleAPI {

	/**
	 * Derived classes must call this from their constructor.
	 * @constructor
	 * @param config {object} the config object passed into the derived class's constructor.
	 */
	constructor(config) {
		super(config);

	}

	get IsParser() {
		return true;
	}

	/**
	 * The rule type.  Used by parser rules to determine if there is a match on the required type.
	 * @returns {string}
	 * @constructor
	 */
	static get Type() {
		return "base_parser";
	}

}

module.exports = ParserAPI;	// Export this so derived classes can extend it.