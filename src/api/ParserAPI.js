const RuleAPI = require("../api/RuleAPI");

/**

 */
class ParserAPI extends RuleAPI {

	/**
	 * Derived classes must call this from their constructor.
	 * @constructor
	 * @param config {object} the config object passed into the derived class's constructor.
	 * @param wrappedRule {TableRuleAPI} the rule for the parser to execute
	 * @param wrappedRuleConfig {object} the config object for the wrappedRule
	 */
	constructor(config, wrappedRule, wrappedRuleConfig) {
		super(config);

		if (!this.config.__state)
			this.config.__state = {}
		if (!this.config.__state.sharedData)
			this.config.__state.sharedData = {}
		if (!this.config.__state.sharedData.Parser) {
			this.config.__state.sharedData.Parser = {};
		}

		this.parserSharedData = this.config.__state.sharedData.Parser

		if(!wrappedRule) {
			this.warning(`No rule was supplied to parser`);
		}

		if(wrappedRule instanceof Function) {
			this.wrappedRule = new wrappedRule(wrappedRuleConfig, this);
		} else {
			this.wrappedRule = wrappedRule;
		}
	}

	get IsParser() {
		return true;
	}

	static isTypeSupported(type) {
		if(Array.isArray(this.Type)) {
			return this.Type.includes(type);
		}

		return type === this.Type;
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