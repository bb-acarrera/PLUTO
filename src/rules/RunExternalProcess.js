const fs = require('fs-extra');
const net = require('net');
const path = require("path");
const spawn = require('child_process').spawn;

const OperatorAPI = require("../api/RuleAPI");
const Util = require("../common/Util");

const useSockets = false;

cleanPipeName = function(str) {

	if(!useSockets) {
		return null;
	}

	if (process.platform === 'win32') {
		/*str = str.replace(/^\//, '');
		str = str.replace(/\//g, '-');
		return '\\\\.\\pipe\\'+str;*/
		return null;
	} else {
		return str;
	}
};

class RunExternalProcess extends OperatorAPI {
	constructor(config) {
		super(config);

		this.changeFileFormat = this.config.attributes && this.config.attributes.changeFileFormat === true;

		this.requiredParser = this.config.attributes ? this.config.attributes.requiredParser : null;

		// Create a unique socket.
		if (config.__state.tempDirectory && config.attributes && config.attributes.executable)
			this.socketName = cleanPipeName(path.resolve(config.__state.tempDirectory, config.attributes.executable + config.id + ".socket"));
		

	}

	runProcess(inputName, outputName, resolve) {
        const attributes = this.config.attributes;
        
        if (!attributes) {
            this.error('No rule attributes set.');
            resolve(null);
            return;
        }
        
        if (!attributes.executable) {
            this.error('No executable in the configuration.');
            resolve(null);
            return;
        }

		if (!attributes.script)
			this.warning('No script in the configuration.');

		// Don't check for the existence of the executable. It might be available in the PATH instead of being a fully qualified reference.
		
		if (attributes.script && !fs.existsSync(attributes.script)) {
			this.error(`${attributes.script} does not exist.`);
            resolve(null);
			return;
		}

		var config = Object.assign({}, this.config);
		if (this.config.__state && this.config.__state.validator) {
			config.parserConfig = this.config.__state.validator.parserConfig || {};

			if(this.config.__state.validator.currentRuleset) {
				if (this.config.__state.validator.currentRuleset.import)
					config.importConfig = this.config.__state.validator.currentRuleset.import.config || {};
				if (this.config.__state.validator.currentRuleset.export)
					config.exportConfig = this.config.__state.validator.currentRuleset.export.config || {};
			}


			if(config.__state.sharedData && config.__state.sharedData.Parser) {
				config.parserState = config.__state.sharedData.Parser ;
			}

			config.validatorState = {};

			Object.keys(config.__state).forEach((key => {
				let value = config.__state[key];
				let type = typeof value;

				if(type !== 'object' && type !== 'function') {
					config.validatorState[key] = value;
				}

			}));


		}

		var json = JSON.stringify(config, (key, value) => {
			if (key.startsWith('_') || key == 'validator')
				return undefined;   // Filter out anything that starts with an underscore that is on the parserConfig.
			else {
				return value;
			}

		});

        var server;
        if (this.socketName) {
            server = net.createServer((c) => {
                // 'connection' listener
                c.on('end', () => {
                    server.unref();
                });

                c.write(json);

    //          c.pipe(c);  //Can't find documentation on what this does and the code works without it.
                c.end();
                server.unref();
            });
            server.listen(this.socketName);

            server.on('error', (err) => {
                let msg = '';

	            if(err.message) {
		            msg = err.message;
	            } else if(typeof err === 'string' ) {
		            msg = err;
	            }

	            this.error(`${attributes.executable} caused an error creating configuration socket: ${msg}`);
            });

//            server.on('close', () => {
//            });
        } else {
	        this.configFile = Util.getTempFileName(config.__state.tempDirectory);
	        fs.writeFileSync(this.configFile, json, 'utf-8');
        }

        // Run the executable. This complains if the executable doesn't exist.
        var encoding = (this.config && this.config.__state && this.config.__state.encoding) ? this.config.__state.encoding : 'utf8';
		var child;

		var args = [];

		if(attributes.script) {
			args.push(attributes.script);
		}

		args.push("-i");
		args.push(inputName);
		args.push("-o");
		args.push(outputName);
		args.push("-e");
		args.push(encoding);

		if(this.socketName) {
			args.push("-s");
			args.push(this.socketName);
		} else {
			args.push("-c");
			args.push(this.configFile);
		}

		child = spawn(attributes.executable, args, { env: process.env });

		child.stdout.on('data', (data) => {
			if (typeof data === 'string')
				this.warning(data);
			else if (data && typeof data.toString === 'function') {
				let str = data.toString();
				let strs = str.split("\n");
				for (var i = 0; i < strs.length; i++) {
					console.log(strs[i]);
					if (strs[i].length > 0)
						this.warning(`${attributes.executable} wrote to stdout: ${strs[i]}.`);
				}
			}
		});

		child.stderr.on('data', (data) => {
			if (typeof data === 'string')
				this.error(data);
			else if (data && typeof data.toString === 'function') {
				let str = data.toString().trim();
				let strs = str.split("\n");
				for (var i = 0; i < strs.length; i++)
					if (strs[i].length > 0) {
					    try {
                            const error = JSON.parse(strs[i]);
                            if (error)
                                this.log(error.type, error.problemFile, error.ruleID, error.description,
	                                error.dataItemId && error.dataItemId.length > 0 ? error.dataItemId : null);
					    }
					    catch (e) {
							console.log(strs[i]);
					        this.error(strs[i]);//`${attributes.executable} wrote to stderr: ${strs[i]}.`);
					    }
					}
			}
		});

		child.on('error', (err) => {
            this.error(`${attributes.executable}: Launching script failed with error: ${err}`);
            if (server)
                server.unref();

			if(this.configFile) {
				fs.unlink(this.configFile);
			}

			resolve(outputName);
		});

		child.on('exit', (code) => {
			if (code != 0)
				this.error(`${attributes.executable} exited with status ${code}.`);

			if (server)
			    server.unref();

			if(this.configFile) {
				fs.unlink(this.configFile);
			}

			resolve(outputName);
		});

	}

	run() {
		return new Promise((resolve, reject) => {

			let outputFile = this.outputFile;

			let finished = () => {
				resolve(this.asFile(outputFile));
			};

			let inputName = this.inputFile;
			if (inputName instanceof Promise) {
				inputName.then((filename) => {
					this.runProcess(filename, outputFile, finished);
				}, (error) => {
					reject(error);
				});
			}
			else
				this.runProcess(inputName, outputFile, finished);

		});


	}

	get structureChange() {
		return this.changeFileFormat;
	}

	get ParserClassName() {
		return this.requiredParser;
	}

	static get ConfigProperties() {
		return this.appendConfigProperties([]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults();
	}
}

module.exports = RunExternalProcess;	// Export this so derived classes can extend it.
