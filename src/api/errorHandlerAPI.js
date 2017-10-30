/**
 * This API class is used to describe the interface to rule operations. This base class can be used by rules that
 * do noy interact with the data, for example metadata rules.
 */
class ErrorHandlerAPI {

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
		this.config = localConfig || {};
	}

	/**
	 * Use this with {@link Validator#log} to log significant errors.
	 * @static
	 * @returns {string}
	 * @private
	 */
	static get ERROR() { return "Error"; }

	/**
	 * Use this with {@link Validator#log} to log simple warnings.
	 * @static
	 * @returns {string}
	 * @private
	 */
	static get WARNING() { return "Warning"; }

	/**
	 * Use this with {@link Validator#log} when reporting information.
	 * @static
	 * @returns {string}
	 * @private
	 */
	static get INFO() { return "Info"; }

	/**
	 * This is called when the application has something to log.
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
		if (this.config && this.config.validator)
			this.config.validator.log(level, problemFileName, ruleID, problemDescription, dataItemId);
		else if (this.config && this.config._debugLogger)
			this.config._debugLogger.log(level, problemFileName, ruleID, problemDescription, dataItemId);
	}

	/**
	 * Add an error to the log. If this is called and {@link RuleAPI#shouldRulesetFailOnError} returns
	 * <code>true</code> then at the completion of this rule the running of the ruleset will terminate.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @param dataItemId {string} or {number} the unique id of the item in a dataset being processed, null if NA
	 */
	error(problemDescription, dataItemId) {
		this.log(ErrorHandlerAPI.ERROR, this.constructor.name, this.config.id, problemDescription, dataItemId);
	}

	/**
	 * Add a warning to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @param dataItemId {string} or {number} the unique id of the item in a dataset being processed, null if NA
	 */
	warning(problemDescription, dataItemId) {
		this.log(ErrorHandlerAPI.WARNING, this.constructor.name, this.config.id, problemDescription, dataItemId);
	}

	/**
	 * Add an information report to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @param dataItemId {string} or {number} the unique id of the item in a dataset being processed, null if NA
	 */
	info(problemDescription, dataItemId) {
		this.log(ErrorHandlerAPI.INFO, this.constructor.name, this.config.id, problemDescription, dataItemId);
	}


}

module.exports = ErrorHandlerAPI;	// Export this so derived classes can extend it.
