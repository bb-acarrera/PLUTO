const fs = require('fs-extra');
const path = require("path");
const spawnSync = require('child_process').spawnSync;

const OperatorAPI = require("../api/RuleAPI");

class RunPythonScript extends OperatorAPI {
	constructor(config) {
		super(config);
	}

	runPython(inputName) {
		let outputName = this.outputFile;

		if (!this.config) {
			this.error(`No configuration specified.`);

			return;
		}

		if (!this.config.pythonScript) {
			this.error('No pythonScript in the configuration.');

			return;
		}

		let pythonScript = path.resolve(this.config.pythonScript);
		if (!fs.existsSync(pythonScript)) {
			this.error(`${pythonScript} does not exist.`);

			return;
		}

		let scriptName = path.basename(this.config.pythonScript);
		try {
			// Run the python script. This complains if the script doesn't exist.
			const results = spawnSync('python', [pythonScript, inputName, outputName, this.config.encoding || 'utf8']);

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

		return outputName;
	}

	run() {
		let inputName = this.inputFile;
		if (inputName instanceof Promise) {
			return inputName.then((filename) => {
				return this.runPython(filename);
			}, (error) => {
				return error;
			});
		}
		else
			return this.asFile(this.runPython(inputName));
	}

	static get ConfigProperties() {
		return [
			{
				name: 'pythonScript',
				type: 'string',
				label: 'Python Script Path',
				tooltip: 'The path to the python script to run.'
			}
		];
	}


	static get ConfigDefaults() {
		return {};
	}
}

module.exports = RunPythonScript;	// Export this so derived classes can extend it.
