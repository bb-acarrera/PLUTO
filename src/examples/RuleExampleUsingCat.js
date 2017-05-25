const spawn = require('child_process').spawn;
const RuleAPI = require("../api/RuleAPI");

class RuleExampleUsingCat extends RuleAPI {
	constructor(config) {
		super(config)
	}

	canUseStreams() {
		return true;
	}

	useStreams(inputStream, outputStream) {
		// Simply pipe the contents of the input stream to the output stream through the "cat" command.

		try {
			const cat = spawn('cat');

			cat.on('error', (e) => {
				this.error(`RuleExampleUsingCat: ` + e);
				inputStream.pipe(outputStream);
			});

			inputStream.pipe(cat.stdin);
			cat.stdout.pipe(outputStream);
		} catch (e) {
			this.error(`RuleExampleUsingCat: ` + e);
			inputStream.pipe(outputStream);
		}


		inputStream.once('readable', () => {
			// Note that this is done as soon as there is data rather than at the end. Otherwise the buffers would fill without any way to drain them.
			this.emit(RuleAPI.NEXT, outputStream);
		});
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingCat;	// Export this so derived classes can extend it.
module.exports.instance = RuleExampleUsingCat;	// Export this so the application can instantiate the class without knowing it's name.
