const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingFiles extends RuleAPI {
	constructor(config) {
		super(config)
	}

	run() {
		return this.inputFile;
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingFiles;
