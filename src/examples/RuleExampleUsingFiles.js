const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingFiles extends RuleAPI {
	constructor(config) {
		super(config)
	}

	canUseFiles() {
		return true;
	}

	useFiles(filename) {
		setImmediate(() => {
			this.emit(RuleAPI.NEXT, filename);
		});
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingFiles;	// Export this so derived classes can extend it.
module.exports.instance = RuleExampleUsingFiles;	// Export this so the application can instantiate the class without knowing it's name.
