const spawn = require('child_process').spawn;
const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingCat extends RuleAPI {
	constructor(config) {
		super(config)
	}

	useStreams(inputStream, outputStream) {
		// Simply pipe the contents of the input stream to the output stream through the "cat" command.

		try {
			const cat = spawn('cat');

			cat.on('error', (e) => {
				this.error(`RuleExampleUsingCat: ` + e);
				inputStream.pipe(outputStream);	// Pipe the input to the output without running through 'cat'.
			});

			inputStream.pipe(cat.stdin);
			cat.stdout.pipe(outputStream);
		} catch (e) {
			this.error(`RuleExampleUsingCat: ` + e);
			inputStream.pipe(outputStream);
		}

		inputStream.once('readable', () => {
			// Note that this is done as soon as there is data (i.e. as soon as the input stream is 'readable')
			// rather than at the end. Otherwise the buffers would fill without any way to drain them.
			this.emit(RuleAPI.NEXT, outputStream);
		});
	}
}

module.exports = RuleExampleUsingCat;
