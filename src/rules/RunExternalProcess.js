const fs = require('fs-extra');
const net = require('net');
const path = require("path");
const spawn = require('child_process').spawn;

const OperatorAPI = require("../api/RuleAPI");

cleanPipeName = function(str) {
	if (process.platform === 'win32') {
		str = str.replace(/^\//, '');
		str = str.replace(/\//g, '-');
		return '\\\\.\\pipe\\'+str;
	} else {
		return str;
	}
};

class RunExternalProcess extends OperatorAPI {
	constructor(config) {
		super(config);

		this.changeFileFormat = this.config.changeFileFormat === true;
		
		// Create a unique socket.
		if (config.__state.tempDirectory && config.attributes && config.attributes.executable)
			this.socketName = cleanPipeName(path.resolve(config.__state.tempDirectory, config.attributes.executable + config.id + ".socket"));
		
		this.tempDir = this.config.__state.tempDirectory;
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
        
	    if (!this.socketName) {
	        // Not likely to occur. Would need config.__state.tempDirectory to be absent.
            this.error("Internal Error: Failed to initialize RunExternalProcess properly.");
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

        var server;
        if (this.socketName) {
            server = net.createServer((c) => {
                // 'connection' listener
                c.on('end', () => {
                    server.unref();
                });

                var config = Object.assign({}, this.config);
                if (this.config.__state && this.config.__state.validator && this.config.__state.validator.currentRuleset) {
                    config.parserConfig = this.config.__state.validator.parserConfig || {};

                    if (this.config.__state.validator.currentRuleset.import)
                        config.importConfig = this.config.__state.validator.currentRuleset.import.config || {};
                    if (this.config.__state.validator.currentRuleset.export)
                        config.exportConfig = this.config.__state.validator.currentRuleset.export.config || {};
                }

                var json = JSON.stringify(config, (key, value) => {
                    if (key.startsWith('_'))
                        return undefined;   // Filter out anything that starts with an underscore that is on the parserConfig.
                    else
                        return value;
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
        }

        // Run the executable. This complains if the executable doesn't exist.
        var encoding = (this.config && this.config.__state && this.config.__state.encoding) ? this.config.__state.encoding : 'utf8';
		var process;
		if (attributes.script)
			process = spawn(attributes.executable, [attributes.script, inputName, outputName, encoding, this.socketName]);
		else
			process = spawn(attributes.executable, [inputName, outputName, encoding, this.socketName]);

		process.stdout.on('data', (data) => {
			if (typeof data === 'string')
				this.warning(data);
			else if (data && typeof data.toString === 'function') {
				let str = data.toString();
				let strs = str.split("\n");
				for (var i = 0; i < strs.length; i++) {
					if (strs[i].length > 0)
						this.warning(`${attributes.executable} wrote to stdout: ${strs[i]}.`);
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
					if (strs[i].length > 0) {
					    try {
                            const error = JSON.parse(strs[i]);
                            if (error)
                                this.log(error.type, error.problemFile, error.ruleID, error.description);
					    }
					    catch (e) {
							console.log(e);
					        this.error(strs[i]);//`${attributes.executable} wrote to stderr: ${strs[i]}.`);
					    }
					}
			}
		});

		process.on('error', (err) => {
            this.error(`${attributes.executable}: Launching script failed with error: ${err}`);
            if (server)
                server.unref();

			resolve(outputName);
		});

		process.on('exit', (code) => {
			if (code != 0)
				this.error(`${attributes.executable} exited with status ${code}.`);

			if (server)
			    server.unref();
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

	static get ConfigProperties() {
		return this.appendConfigProperties([
			{
				name: 'changeFileFormat',
				type: 'boolean',
				label: 'Process will change file format',
				tooltip: 'Set to true if this process will alter the format of the file (e.g. csv to geojson)'
			}
		]);
	}


	static get ConfigDefaults() {
		return this.appendDefaults({changeFileFormat: false});
	}
}

module.exports = RunExternalProcess;	// Export this so derived classes can extend it.
