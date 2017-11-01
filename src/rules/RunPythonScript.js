const fs = require('fs-extra');
const net = require('net');
const path = require("path");
const spawn = require('child_process').spawn;

const OperatorAPI = require("../api/RuleAPI");

class RunPythonScript extends OperatorAPI {
	constructor(config) {
		super(config);

		this.changeFileFormat = this.config.changeFileFormat === true;
		
		// Create a unique socket.
		var scriptName = path.basename(this.config.pythonScript, ".py");
		if (config.tempDirectory)
			this.socketName = path.resolve(config.tempDirectory, scriptName + config.id + ".socket");
		this.tempDir = this.config.tempDirectory;
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

		if (this.socketName) {
			const server = net.createServer((c) => {
				// 'connection' listener
				console.log('client connected');
				c.on('end', () => {
					console.log('client disconnected');
				});
				
				c.write(JSON.stringify(this.config, (key, value) => {
					if (key == 'validator')
						return null;
					else
						return value;
				}));
				
	//			c.pipe(c);	Can't find documentation on what this does and the code works without it.
				c.end();
				server.unref();
			});
			server.listen(this.socketName);
			
			server.on('error', (err) => {
				this.error(`${pythonScript} caused an error creating configuration socket.`);
				this.info(err);
			});
		}
	
		let scriptName = path.basename(this.config.pythonScript);	
		return new Promise((resolve, reject) => {
			// Run the python script. This complains if the script doesn't exist.
			const python = spawn('python', [pythonScript, inputName, outputName, this.config.encoding || 'utf8', this.socketName]);
			python.stdout.on('data', (data) => {
				if (typeof data === 'string')
					this.warning(data);
				else if (data && typeof data.toString === 'function') {
					let str = data.toString();
					let strs = str.split("\n");
					for (var i = 0; i < strs.length; i++) {
						if (strs[i].length > 0)
							this.warning(`${scriptName} wrote to stdout: ${strs[i]}.`);
					}
				}
			});
			
			python.stderr.on('data', (data) => {
				if (typeof data === 'string')
					this.error(data);
				else if (data && typeof data.toString === 'function') {
					let str = data.toString().trim();
					let strs = str.split("\n");
					for (var i = 0; i < strs.length; i++)
						if (strs[i].length > 0)
							this.error(`${scriptName} wrote to stderr: ${strs[i]}.`);
				}
			});
			
			python.on('error', (err) => {
	            this.error(`${scriptName}: Launching script failed with error: ${err}`);
			});
			
			python.on('close', (code) => {
				if (code != 0)
					this.error(`${scriptName} exited with status ${code}.`);
				
				resolve(outputName);
			});
		});
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

	get structureChange() {
		return this.changeFileFormat;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'pythonScript',
				type: 'string',
				label: 'Python Script Path',
				tooltip: 'The path to the python script to run.'
			},
			{
				name: 'changeFileFormat',
				type: 'boolean',
				label: 'Script will change file format',
				tooltip: 'Set to true if this script will alter the format of the file (e.g. csv to geojson)'
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({changeFileFormat: false});
	}
}

module.exports = RunPythonScript;	// Export this so derived classes can extend it.
