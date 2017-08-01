const RuleAPI = require("../api/RuleAPI");

class RuleExampleUsingFiles extends RuleAPI {
	constructor(config) {
		super(config)
	}

	run() {
		let input = this.inputFile;

		if (input instanceof Promise)
			return input.then((file) => {
				return this.asFile(file);
			});
		else
			return this.asFile(input);
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingFiles;
