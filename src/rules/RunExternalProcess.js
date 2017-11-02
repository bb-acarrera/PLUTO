const fs = require('fs-extra');
const net = require('net');
const path = require("path");
const spawn = require('child_process').spawn;

const OperatorAPI = require("../api/RuleAPI");

class RunExternalProcess extends OperatorAPI {
	constructor(config) {
		super(config);

		this.changeFileFormat = this.config.changeFileFormat === true;
		
		// Create a unique socket.
		if (config.tempDirectory && config.attributes && config.attributes.executable)
			this.socketName = path.resolve(config.tempDirectory, config.attributes.executable + config.id + ".socket");
		this.tempDir = this.config.tempDirectory;
	}

	runProcess(inputName) {
		let outputName = this.outputFile;

		if (!this.config) {
			this.error(`No configuration specified.`);

			return;
		}

		const attributes = this.config.attributes;
		
		if (!attributes) {
            this.error('No attributes in the configuration.');

            return;
		}
		
		if (!attributes.executable) {
			this.error('No executable in the configuration.');

			return;
		}
		
		if (!attributes.script) {
			this.warning('No script in the configuration.');

			return;
		}

		// Don't check for the existence of the executable. It might be available in the PATH instead of being a fully qualified reference.
		
		if (attributes.script && !fs.existsSync(attributes.script)) {
			this.error(`${script} does not exist.`);

			return;
		}

		if (this.socketName) {
			const server = net.createServer((c) => {
				// 'connection' listener
				console.log('client connected');	// TODO: Remove this.
				c.on('end', () => {
					console.log('client disconnected');	// TODO: Do something here?
				});
				
				var config = {};
				config.encoding = this.config.encoding;
				config.name = this.config.name;
				config.attributes = this.config.attributes;
				config.rootDirectory = this.config.rootDirectory;
				config.tempDirectory = this.config.tempDirectory;
				config.sharedData = this.config.sharedData;
				if (this.config.validator && this.config.validator.currentRuleset) {
					config.parserConfig = this.config.validator.parserConfig || {};
					
					if (this.config.validator.currentRuleset.import)
						config.importConfig = this.config.validator.currentRuleset.import.config || {};
					if (this.config.validator.currentRuleset.export)
						config.exportConfig = this.config.validator.currentRuleset.export.config || {};
				}
				
				c.write(JSON.stringify(config, (key, value) => {
					if (key == 'validator')
						return undefined;	// Filter out the validator that is on the parserConfig.
					else
						return value;
				}));
				
	//			c.pipe(c);	Can't find documentation on what this does and the code works without it.
				c.end();
				server.unref();
			});
			server.listen(this.socketName);
			
			server.on('error', (err) => {
				this.error(`${executable} caused an error creating configuration socket.`);
				this.info(err);
			});
		}
	
		return new Promise((resolve, reject) => {
			// Run the executable. This complains if the executable doesn't exist.
			var process;
			if (attributes.script)
				process = spawn(attributes.executable, [attributes.script, inputName, outputName, this.config.encoding || 'utf8', this.socketName]);
			else
				process = spawn(attributes.executable, [inputName, outputName, this.config.encoding || 'utf8', this.socketName]);
			
			process.stdout.on('data', (data) => {
				if (typeof data === 'string')
					this.warning(data);
				else if (data && typeof data.toString === 'function') {
					let str = data.toString();
					let strs = str.split("\n");
					for (var i = 0; i < strs.length; i++) {
						if (strs[i].length > 0)
							this.warning(`${executable} wrote to stdout: ${strs[i]}.`);
					}
				}
			});
			
			process.stderr.on('data', (data) => {
				if (typeof data === 'string')
					this.error(data);
				else if (data && typeof data.toString === 'function') {
					let str = data.toString().trim();
					let strs = str.split("\n");
					for (var i = 0; i < strs.length; i++)
						if (strs[i].length > 0)
							this.error(`${executable} wrote to stderr: ${strs[i]}.`);
				}
			});
			
			process.on('error', (err) => {
	            this.error(`${executable}: Launching script failed with error: ${err}`);
			});
			
			python.on('close', (code) => {
				if (code != 0)
					this.error(`${executable} exited with status ${code}.`);
				
				resolve(outputName);
			});
		});
	}

	run() {
		let inputName = this.inputFile;
		if (inputName instanceof Promise) {
			return inputName.then((filename) => {
				return this.runProcess(filename);
			}, (error) => {
				return error;
			});
		}
		else
			return this.asFile(this.runProcess(inputName));
	}

	get structureChange() {
		return this.changeFileFormat;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([
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

module.exports = RunExternalProcess;	// Export this so derived classes can extend it.
