const spawn = require('child_process').spawn;
const RuleAPI = require("../api/RuleAPI");

class RuleExampleUsingCat extends RuleAPI {
	constructor(config) {
		super(config)
	}

	run() {
		// Simply pipe the contents of the input stream to the output stream through the "cat" command.
		let inputStream = this.inputStream;
		let outputStream = this.outputStream;

		try {
			const cat = spawn('cat');

			cat.on('error', (e) => {
				this.error(`RuleExampleUsingCat: ` + e.message);
				inputStream.pipe(outputStream);	// Pipe the input to the output without running through 'cat'.
			});

			inputStream.pipe(cat.stdin);
			cat.stdout.pipe(outputStream);
		} catch (e) {
			this.error(`RuleExampleUsingCat: ` + e);
			inputStream.pipe(outputStream);
		}

		return this.asStream(outputStream);
	}
}

module.exports = RuleExampleUsingCat;
