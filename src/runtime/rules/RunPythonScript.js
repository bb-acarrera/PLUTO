const fs = require('fs-extra');
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
		let outputName = this.config.validator.getTempName();

		if (!this.config) {
			this.error(`No configuration specified.`);
			setImmediate(() => {
				this.emit(RuleAPI.NEXT, outputName);
			});

			return;
		}

		if (!this.config.PythonScript) {
			this.error('No PythonScript in the configuration.');
			setImmediate(() => {
				this.emit(RuleAPI.NEXT, outputName);
			});

			return;
		}

		let pythonScript = path.resolve(this.config.PythonScript);
		if (!!fs.existsSync(pythonScript)) {
			this.error(`${pythonScript} does not exist.`);
			setImmediate(() => {
				this.emit(RuleAPI.NEXT, outputName);
			});

			return;
		}

		let scriptName = path.basename(this.config.PythonScript);
		try {
			// Run the python script. This complains if the script doesn't exist.
			const results = spawnSync('python', [pythonScript, inputName, outputName]);

			if (results) {
				// Write any stdout/stderr output to the error log.

				if (typeof results.stdout === 'string')
					this.warning(results.stdout);
				else if (results.stdout && typeof results.stdout.toString === 'function') {
					let str = results.stdout.toString();
					let strs = str.split("\n");
					for (var i = 0; i < strs.length; i++) {
						if (strs[i].length > 0)
							this.warning(`${scriptName} wrote to stdout: ${strs[i]}.`);
					}
				}

				if (typeof results.stderr === 'string')
					this.error(results.stderr);
				else if (results.stderr && typeof results.stderr.toString === 'function') {
					let str = results.stderr.toString().trim();
					let strs = str.split("\n");
					for (var i = 0; i < strs.length; i++)
						if (strs[i].length > 0)
							this.error(`${scriptName} wrote to stderr: ${strs[i]}.`);
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
