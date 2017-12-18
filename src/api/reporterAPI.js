/**
 * This API class is used to describe the interface to validator result reporting operations. This base class should be
 * used by classes that wish to report validation results to other systems (e.g. email)
 */
class ReporterAPI {

	/**
	 * The base constructor. This simply sets <code>this.config</code> to the passed in configuration object. This config object
	 * will be the reports's individual configuration (if any)
	 * @param validatorConfig {object} configuration as defined in the validator config file. These should
	 * be global config properties such as REST API URLs, authentication details, etc.
	 * @param rulesetConfig {object} configuration from the current running ruleset. These properties are defined in
	 * ConfigProperties and appear as fields when creating a ruleset and should be specific to the running instance such
	 * as target email address.
	 */
	constructor(validatorConfig, rulesetConfig) {
		this.validatorConfig = validatorConfig;
		this.rulesetConfig = rulesetConfig;
	}

	/**
	 * This is called by the validator to instantiate a connection to an external service. This is to allow the reporter
	 * to log any problems making a connection.
	 * @returns {Promise} must return a promise that resolves when the connection has been successfully made. If the
	 * promise is rejected, the validator will not call sendReport, and the message as part of reject will be logged.
	 * The Promise must resolve the reporter object (this)
	 */
	initialize() {
		new Promise((resolve, reject) => {
			reject('ReporterAPI initialize must be overridden');
		});

	}

	/**
	 * This is called by the validator when processing and the initialize is complete and the results are to be communicated.
	 * This is the final step of the validator, so if there are errors they can only be written to the console.
	 * @param subject {string} a short description of the result in plain text
	 * @param body {string} a detailed description of the result in html
	 * @returns {Promise} must return a promise that resolves when the message has been sent
	 */
	sendReport(subject, body) {

		return new Promise((resolve, reject) => {
			let msg = 'ReporterAPI sendReport must be overridden: \n' + subject + ':\n' + body;

			console.log(msg);
			reject(msg);
		});


	}

	/**
	 * The list of config properties.  Used by the UI for display.
	 * @returns {Array}
	 * @constructor
	 */
	static get ConfigProperties() {
		return [];
	}

	/**
	 * The default values for configuration.
	 * @returns {{}}
	 * @constructor
	 */
	static get ConfigDefaults() {
		return {};
	}


}

module.exports = ReporterAPI;	// Export this so derived classes can extend it.
