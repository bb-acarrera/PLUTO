const BaseRuleAPI = require('./BaseRuleAPI');

/**
 *
 * PostTaskAPI rules should implement a <code>run()</code> method that operates on <code>this.config.sharedData</code>
 * the object that maintains the metadata.
 */
class PostTaskAPI extends BaseRuleAPI {
	/**
	 * The base constructor. This simply sets <code>this.config</code> to the passed in configuration object.
	 * @param localConfig {object} the rule's configuration as defined in the ruleset file or a standalone config file.
	 */
	constructor(localConfig) {
		super(localConfig);
	}

	static appendConfigProperties(inProperties) {

		if(inProperties) {
			return inProperties;
		}

		return []
	}

	static appendDefaults(inDefaults) {

		const defaults = {};

		if(inDefaults) {
			return Object.assign({}, inDefaults, defaults);
		}

		return defaults;
	}
}

module.exports = PostTaskAPI;	// Export this so derived classes can extend it.

