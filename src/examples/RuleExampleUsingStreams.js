const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingStreams extends RuleAPI {
	constructor(config) {
		super(config)
	}

	run() {
		let inputStream = this.inputStream;
		let outputStream = this.outputStream;

		// Simply pipe the contents of the input stream to the output stream.
		inputStream.pipe(outputStream);

		return this.asStream(outputStream);
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingStreams;
