const path = require("path");
const spawnSync = require('child_process').spawnSync;

const RuleAPI = require("../api/RuleAPI");

class RunPythonScript extends RuleAPI {
	constructor(config) {
		super(config);
	}

	canUseFiles() {
		return true;
	}

	useFiles(inputName) {
		if (!this.config) {
			this.error(`No configuration specified.`);
			setImmediate(() => {
				this.emit(RuleAPI.NEXT, undefined);
			});

			return;
		}

		if (!this.config.PythonScript) {
			this.error('No PythonScript in the configuration.');
			setImmediate(() => {
				this.emit(RuleAPI.NEXT, undefined);
			});

			return;
		}

		let scriptName = path.basename(this.config.PythonScript);
		let outputName = this.config.validator.getTempName();
		try {
			const results = spawnSync('python', [this.config.PythonScript, inputName, outputName]);

			if (results) {
				if (typeof results.stdout === 'string')
					this.warning(results.stdout);
				else if (results.stdout && typeof results.stdout.toString === 'function') {
					let str = results.stdout.toString();
					if (str.length > 0)
						this.warning(str);
				}

				if (typeof results.stderr === 'string')
					this.error(results.stderr);
				else if (results.stderr && typeof results.stderr.toString === 'function') {
					let str = results.stderr.toString().trim();
					if (str.length > 0)
						this.error(str);
				}

				if (results.status != 0)
					this.error(`${scriptName} exited with status ${results.status}.`);
			}
		} catch (e) {
			this.error(`${scriptName}: ${e}`);
		}

		setImmediate(() => {
			this.emit(RuleAPI.NEXT, outputName);
		});
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RunPythonScript;	// Export this so derived classes can extend it.
module.exports.instance = RunPythonScript;	// Export this so the application can instantiate the class without knowing it's name.
