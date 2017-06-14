const BaseRuleAPI = require('./BaseRuleAPI');

/**
 * This API class is used to describe the interface to rule operations. The methods indicate how the
 * data can be passed to and from the rule. Multiple input and output methods can return true. This allows the
 * application to select the best option for connecting two rules together.
 *
 * The class extends EventEmitter so that rules run asynchronously. When a rule completes it should post the static
 * {@link RuleAPI.NEXT} value.
 */
class MetadataRuleAPI extends BaseRuleAPI {
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
	constructor(localConfig) {
		super(localConfig);
	}

	updateMetadata() {

	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = MetadataRuleAPI;	// Export this so derived classes can extend it.
module.exports.instance = MetadataRuleAPI;	// Export this so the application can instantiate the class without knowing it's name.
