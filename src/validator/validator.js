/**
 * @private
 */
const fs = require('fs-extra');
const path = require("path");
const program = require("commander");
const rimraf = require('rimraf');
const stream = require('stream');

const ErrorHandlerAPI = require("../api/errorHandlerAPI");

const Util = require("../common/Util");
const Data = require("../common/dataDb");

const ErrorLogger = require("./ErrorLogger");
const RuleSet = require("./RuleSet");

const RuleLoader = require('../common/ruleLoader')

const version = '0.1'; //require("../../package.json").version;

// Add a new method to Promises to help with running rules.
Promise.prototype.thenReturn = function(value) {
	return this.then(function(result) {
		return {result: result, index: value};
	})
};


/*
 * The Validator class is the main application class.
 */
class Validator {
	/*
	 * The <em>private</em> validator constructor.
	 * @param config
	 * @private
	 */
	constructor(config, Data) {
		this.config = config || {};

		this.rootDir = Util.getRootDirectory(this.config);

		if (!fs.existsSync(this.rootDir))
			throw "Failed to find RootDirectory \"" + this.rootDir + "\".\n";

		if (this.config.rulesDirectory)
			this.config.rulesDirectory = path.resolve(this.rootDir, this.config.rulesDirectory);
		else
			this.config.rulesDirectory = path.resolve(this.rootDir, 'rules');	// By default rules live with the rulesets.

		if (!fs.existsSync(this.config.rulesDirectory))
			console.log("Failed to find custom RulesDirectory \"" + this.config.rulesDirectory + "\".\n");

		this.inputDirectory  = path.resolve(this.rootDir, this.config.inputDirectory || "");
		this.outputDirectory = path.resolve(this.rootDir, this.config.outputDirectory || "");

		if (!fs.existsSync(this.outputDirectory))
			fs.mkdirSync(this.outputDirectory);	// Make sure the outputDirectory exists.

		this.logger = new ErrorLogger(config);

		// Remember the name of the current ruleset and rule for error reporting.
		this.rulesetName = undefined;
		this.ruleName = undefined;

		this.updateConfig(this.config);

		if(!Data) {
			throw "No data accessor supplied";
		}

		// This needs to be done after the above tests and setting of the global config object.
        this.data = Data(this.config);

		this.ruleLoader = new RuleLoader(this.config.rulesDirectory);
    }

	/*
	 * Run the ruleset, as defined by the config file, over the inputFile producing the outputFile.
	 */
	runRuleset(inputFile, outputFile, inputEncoding, inputDisplayName) {
		this.running = true;	// Used by finishRun() to determine if it should clean up. Avoids issues with finishRun() being called twice.

		try {
			this.tempDir = Util.getTempDirectory(this.config, this.rootDir);
		}
		catch (e) {
			this.error(e);
			throw e;
		}

		this.data.createRunRecord(this.config.ruleset).then((runId) => {

			this.runId = runId;
			console.log("runId:" + runId);

			this.data.retrieveRuleset(this.config.ruleset, this.config.rulesetOverride)
				.then((ruleset) => {

						this.processRuleset(ruleset, outputFile, inputEncoding, inputFile, inputDisplayName);
					},
					(error)=>{
						this.error(error);
						this.finishRun();
					}).catch((e) => {
						if(!e.message){
							this.error(e);
						}
						else {
							this.error(e.message);
						}
						this.finishRun();
					}
			);
		}, (error) => {
			console.log("Error creating run record: " + error);
			console.log("aborting");

		});
	}

	processRuleset(ruleset, outputFile, inputEncoding, inputFile, inputDisplayName){
		if(!ruleset){
			throw new Error("No Ruleset found for: " + this.config.ruleset);
		}

		let rulesDirectory = this.config.rulesDirectory;

		this.rulesetName = ruleset.name || "Unnamed";

		this.outputFileName = outputFile;
		this.encoding = inputEncoding || 'utf8';
		this.currentRuleset = ruleset;
		this.rulesDirectory = rulesDirectory;

		if(ruleset.parser) {
			this.parserClass = this.getParserClass(ruleset.parser);
		}

		if (!this.outputFileName && !ruleset.export) {
			this.warning("No output file specified.");
		}

		if(!ruleset.import && !inputFile) {
			throw "No input file specified.";
		}

		if(inputFile) {
			this.inputFileName = this.config.inputDirectory ? path.resolve(this.config.inputDirectory, inputFile) : path.resolve(inputFile);

			if(inputDisplayName) {
				this.displayInputFileName = inputDisplayName;
			} else {
				this.displayInputFileName = path.basename(this.inputFileName);
			}


			this.runRules(ruleset, this.inputFileName);
		} else {
			this.inputFileName = this.getTempName();

			this.importFile(ruleset.import, this.inputFileName).then( (displayInputFileName) => {

					this.displayInputFileName = displayInputFileName;

					this.runRules(ruleset, this.inputFileName);


				},error => {
					this.error("Failed to import file: " + error);
					this.finishRun();
				})
				.catch(() => {
					this.finishRun();
				});
		}

    }

	/*
	 * Run the list of rules that are all in the same rulesDirectory, starting with the given file.
	 * (The output from a rule will generally be a new file which is input to the next rule.)
	 */
	runRules(ruleset, file) {

		this.sharedData = ruleset.config && ruleset.config.sharedData ? ruleset.config.sharedData : {};
		this.abort = false;

		try {

			if (!fs.existsSync(file))
				throw "Input file \"" + file + "\" does not exist.";

			if (!ruleset.rules || ruleset.rules.length == 0) {
				this.warning("Ruleset \"" + this.rulesetName + "\" contains no rules.");
				this.finishRun();
				return;
			}

			let rules = [];
			let cleanupRules = [];
			ruleset.rules.forEach((ruleConfig) => {
				let rule = this.getRule(ruleConfig);

				if(rule.getSetupRule) {
					const setup = rule.getSetupRule();
					if(setup) {
						rules.push(setup);
					}

				}

				if(rule.getCleanupRule) {
					const cleanup = rule.getCleanupRule();
					if(cleanup) {
						cleanupRules.push(cleanup);
					}

				}

				if(rule.structureChange) {
					cleanupRules.forEach((cleanupRule) => {
						rules.push(cleanupRule);
					});
					cleanupRules = [];
				}

				rules.push(rule);

			});

			cleanupRules.forEach((cleanupRule) => {
				rules.push(cleanupRule);
			});

			if(this.logger.getCount(ErrorHandlerAPI.ERROR) > 0) {
				this.abort = true;
				throw "Errors in rule configuration. Aborting.";
			}


			// As a first step get the file locally. Do this to simplify running the rules (they
			// all run locally) and make sure the data is all available at the start of the process.
			const localFileName = this.getTempName();
			this.getFile(file, localFileName);

			let validator = this;
			Promise.resolve({result: {file: localFileName}, index: 0}).then(function loop(lastResult) {
				if (lastResult.index < rules.length && !validator.abort)
					return rules[lastResult.index]._run(lastResult.result).thenReturn(lastResult.index + 1).then(loop);
				else
					return lastResult;
			}).catch((e) => {
				const errorMsg = `${this.rulesetName}: Rule: "${this.ruleName}" failed.\n\t${e.message ? e.message : e}`;
				this.error(errorMsg);
			}).then((lastResult) => {
				if(validator.abort) {
					this.finishRun();
				} else if (lastResult && lastResult.result && lastResult.result.stream) {
					// Need to get the stream into a file before finishing otherwise the exporter may export an empty file.
					let p = new Promise((resolve, reject) => {
						let dest = this.putFile(lastResult.result.stream, this.getTempName());
						dest.stream.on('finish', () => {
							resolve(dest.path);
						});
						dest.stream.on('error', (e) => {
							reject(e)
						});
					});
					p.then((filename) => {
						if(validator.abort) {
							this.finishRun();
						} else {
							this.finishRun({file: filename});
						}

					}, (error) => {
						this.error('Error writing stream: ' + error);
						this.finishRun();
					});
				}
				else
					this.finishRun(lastResult ? lastResult.result : undefined);
			});

			if (!ruleset.rules || ruleset.rules.length == 0)
				this.finishRun(this.displayInputFileName);	// If there are rules this will have been run asynchronously after the last run was run.

		} catch(e) {
			this.error("Ruleset \"" + this.rulesetName + "\" failed.\n\t" + e);
			throw e;
		}
	}

	getRule(ruleDescriptor) {
		// TODO: Get all the rules before running them. This way if any rules are missing an error can be
		// raised without affecting the later running of the rules.
		var ruleClass = this.loadRule(ruleDescriptor.filename);


		// Get the rule's config.
		let config = ruleDescriptor.config || {};

		// Set the validator so that the rule can report errors and such.
		// TODO: This would still have to be done when running the rules, not before.
		this.updateConfig(config);
		config.name = config.name || ruleDescriptor.filename;
		this.ruleName = config.name;
		config.errors = ruleDescriptor.errors;

		let rule;

		if(ruleClass.NeedsParser) {

			if(!this.parserClass) {
				throw("Rule requires parser, but no parser in ruleset");
			}

			if(ruleClass.Parser !== this.parserClass.Type) {
				throw(`Rule/Parser mistmatch. Rule ${ruleDescriptor} needs ${ruleClass.Parser} parser but ${this.parserConfig.name} is ${this.parserClass.Type}`);
			}

			this.updateConfig(this.parserConfig);

			rule = new this.parserClass(this.parserConfig, ruleClass, config);
		} else {
			rule =  new ruleClass(config);
		}
		return rule;
	}

	getParserClass(parserDescriptor) {
		var parserClass = this.ruleLoader.parsersMap[parserDescriptor.filename];

		if(!parserClass) {
			parserClass = this.loadRule(parserDescriptor.filename);
		}


		let config = parserDescriptor.config;

		this.updateConfig(config);
		config.name = config.name || parserDescriptor.filename;
		this.parserName = config.name;
		this.parserConfig = config;

		return parserClass;
	}

	/**
	 * Save the results to a local file.
	 * @param results a results object from a ruleset run.
	 * @private
	 */
	saveResults(results) {

		if (results && this.outputFileName) {
			if (results.file)
				this.putFile(results.file, this.outputFileName);
			else if (results.stream)
				this.putFile(results.stream, this.outputFileName);
			else if (results.data)
				this.saveFile(results.data, this.outputFileName, this.encoding);
		}
	}

	/**
	 * Do necessary finishing work at the completion of a run. This work includes using the export plug-in, if one
	 * was specified, to export the result file, and then calls {@link saveRunRecord} to save the run record.
	 * @param results a results object from a ruleset run.
	 * @private
	 */
	finishRun(results) {

		return new Promise((resolve) => {
			if (!this.running) {
				resolve();
				return;
			}

			this.running = false;
			if(!this.inputFileName){
				this.inputFileName = "";
			}

			if(!results) {
				console.error("No results");
				this.error("No results were produced.");
			}

			if(this.outputFileName) {

				if(results) {
					this.saveResults(results);
				}
				this.finalize().then(() => resolve());

			} else if(this.currentRuleset && this.currentRuleset.export) {
				var resultsFile = null;

				if (results && results.file)
					resultsFile = results.file;
				else if (results && results.stream) {
					resultsFile = this.getTempName();
					this.putFile(results.stream, resultsFile, this.encoding);
				}
				else if (results && results.data) {
					resultsFile = this.getTempName();
					this.saveFile(results.data, resultsFile, this.encoding);
				}
				else if(results)
					this.error("Unrecognized results structure.");

				this.exportFile(this.currentRuleset.export, resultsFile, this.runId)
					.then(() => {},

						(error) => {
							this.error("Export failed: " + error)	;
						})
					.catch((e) => {
						this.error("Export" + importConfig.filename + " fail unexpectedly: " + e);
					})
					.then(() => {
						this.finalize().then(() => resolve());
					});
			} else {
				this.warning("No output method specified");
				this.finalize().then(() => resolve());
			}
		});
	}

	finalize() {
		return new Promise((resolve) => {
			this.data.saveRunRecord(this.runId, this.logger.getLog(),
				this.config.ruleset, this.displayInputFileName, this.outputFileName, this.logger.getCounts())
				.then(() => {}, (error) => console.log('error saving run: ' + error))
				.catch((e) => console.log('Exception saving run: ' + e))
				.then(() => {
					this.cleanup();
					resolve();
				});
		});


	}

	/**
	 * Clean up any temporary artifacts.
	 * @private
	 */
	cleanup() {

		//kill the database
		this.data.end();

		// Remove the temp directory and contents.
		try {
			rimraf.sync(this.tempDir, null, (e) => {
				this.error('Unable to delete folder: ' + this.tempDir + '.  Reason: ' + e);
			});
		} catch (e) {
			this.error('Unable to delete folder: ' + this.tempDir + '.  Reason: ' + e);
		}

		console.log("Done.");

	}

	// Add some useful things to a config object.
	updateConfig(config) {
		config.rootDirectory = config.rootDirectory || this.rootDir;
		config.tempDirectory = config.tempDirectory || this.tempDir;
		config.encoding = config.encoding || this.encoding;
		config.validator = this;
		config.sharedData = this.sharedData;
	}

	// Create a unique temporary filename in the temp directory.
	getTempName() {
		const filename = Util.createGUID();
		return path.resolve(this.tempDir, filename);
	}

	/**
	 * This method is used by the application to load the given file synchronously. Derived classes should implement
	 * everything to load the file into local storage. An error should be thrown if the file cannot be loaded.
	 * @param filename {string} the name of the file to load.
	 * @param encoding {string} the character encoding for the file. The default is 'utf8'.
	 * @returns {object|string} Returns an object (generally a string) containing the loaded file.
	 * @throws Throws an error if the file cannot be found or loaded.
	 * @private
	 */
	loadFile(filename, encoding) {
		return fs.readFileSync(path.resolve(this.inputDirectory, filename), encoding || 'utf8');
	}



	/**
	 * This method is used by the application to save the given file synchronously.
	 * @param fileContents {object | string} the contents of the file.
	 * @param filename {string} the name of the file to save.
	 * @param encoding {string} the character encoding for the file. The default is 'utf8'.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 * @private
	 */
	saveFile(fileContents, filename, encoding) {
		try {
			if (!fs.existsSync(this.outputDirectory))
				fs.mkdirSync(this.outputDirectory);	// Make sure the outputDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\".\n" + e);	// Can't create the outputDirectory to write to.
			throw e;
		}

		fs.writeFileSync(path.resolve(this.outputDirectory, filename), fileContents, encoding || 'utf8');
	}

	/**
	 * This method is used by the application to save the given data to a temporary file synchronously.
	 * @param filename {string} the name of the file to save.
	 * @param fileContents {object | string} the contents of the file.
	 * @param encoding {string} the character encoding for the file. The default is 'utf8'.
	 * @return {string} the name of the temporary file.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 * @private
	 */
	saveLocalTempFile(fileContents, encoding) {
		const fullname = this.getTempName();
		fs.writeFileSync(fullname, fileContents, encoding);
		return fullname;
	}

	/**
	 * This method is used by the application to copy a local file (generally the final result of running a ruleset)
	 * to a remote destination managed by the plugin.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the remote location.
	 * @param fileNameOrStream {stream|string} the absolute name of the local file to copy or a Readable stream to read the data from.
	 * @param remoteFileName {string} the name of the remote copy of the file.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @private
	 */
	putFile(fileNameOrStream, remoteFileName) {
		try {
			if (!fs.existsSync(this.outputDirectory))
				fs.mkdirSync(this.outputDirectory);	// Make sure the outputDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\".\n" + e);	// Can't create the outputDirectory to write to, so can't use this logger.
			throw e;
		}

		let dst;
		let dstPath = path.resolve(this.outputDirectory, remoteFileName);
		if (typeof fileNameOrStream === 'string') {
			fs.copySync(fileNameOrStream,dstPath);
		}
		else {
			dst = fs.createWriteStream(dstPath);
			fileNameOrStream.pipe(dst);
		}

		return { path: dstPath, stream: dst };
	}

	/**
	 * This method is used by the application to copy a remote file (generally the input to a ruleset) managed by
	 * the plugin to a local destination managed by this application.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the local location.
	 * @param remoteFileName {string} the name of the remote copy of the file.
	 * @param localFileName {string} the absolute name of the local file to copy.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @private
	 */
	getFile(remoteFileName, localFileName) {
		fs.copySync(path.resolve(this.inputDirectory, remoteFileName), localFileName);
	}





	/**
	 * This method return a Promise that loads an importer plugin and then uses that plugin to import a file.
	 * @param importConfig the configuration identifying the import plugin and the file to import.
	 * @param targetFilename the final name for the imported file.
	 * @returns {Promise} the Promise object that attempts to load the importer and import a file.
	 * @private
	 */
	importFile(importConfig, targetFilename) {
		let validator = this;
		return new Promise((resolve, reject) => {
			var importerClass = this.loadImporter(importConfig);

			const importerName = importConfig.filename || importConfig.scriptPath;

			if(!importerClass) {
				reject("Could not find importer " + importerName );
				return;
			}

			this.updateConfig(importConfig.config);
			let importer = new importerClass(importConfig.config);

			if(!importer.importFile) {
				reject("Importer " + importerName + " does not have importFile method");
				return;
			}

			importer.importFile(targetFilename).then(function(displayInputFileName) {
					// Save the encoding set by the importer.
					validator.encoding = importConfig.config.encoding || 'utf8';
					resolve(displayInputFileName);
				}, error => {
					reject("Importer " + importerName + " failed: " + error);
				})
				.catch((e) => {
					reject("Importer" + importerName + " fail unexpectedly: " + e);
				});
		});
	}

	/**
	 * This method loads an exporter plugin and then uses that plugin to export the resulting file.
	 * @param exportConfig a configuration object that describes the exporter.
	 * @param filename the name of the file to export
	 * @param runId the ID of this run of the ruleset.
	 * @returns {Promise} the promise object that does all the work.
	 * @private
	 */
	exportFile(exportConfig, filename, runId) {
		return new Promise((resolve, reject) => {

			const exporterName = exportConfig.filename || exportConfig.scriptPath;

			if (!filename) {
				this.warning(`Exporter ${exporterName}: no filename specified.`);
			}
			else if(!fs.existsSync(filename)) {
				this.warning(`Exporter ${exporterName}: ${filename} does not exist.`);
			}

			var exporterClass = this.loadExporter(exportConfig);

			if(!exporterClass) {
				reject("Could not find exporter " + exporterName);
				return;
			}

			this.updateConfig(exportConfig.config);
			let exporter = new exporterClass(exportConfig.config);

			if(!exporter.exportFile) {
				reject("Exporter " + exporterName + " does not have exportFile method");
				return;
			}

			exporter.exportFile(filename, runId, this.logger.getLog()).then(function() {
					resolve();
				}, error => {
					reject("Exporter " + exporterName + " failed: " + error);
				})
				.catch((e) => {
					reject("Exporter" + exporterName + " fail unexpectedly: " + e);
				});

		});
	}

	/**
	 * A method for loading a rule object.
	 * @param filename the name of the rule file to load.
	 * @param rulesDirectory the directory rules are kept in. If this is <code>null</code> then an attempt is made
	 * to resolve the filename against the current working directory. If the rule does not exist in either location
	 * then an attempt is made to load the plugin from '../rules' relative to the current working directory.
	 * @returns {*} the executable rule if it could be loaded.
	 * @private
	 */
	loadRule(filename) {

		if (!filename)
			throw("Rule has no 'filename' property.");

		if(this.ruleLoader.rulesMap[filename]) {
			return this.ruleLoader.rulesMap[filename];
		}

		// Find the rule file.

		let ruleFilename = this.config.rulesDirectory === undefined ? path.resolve(filename) : path.resolve(this.config.rulesDirectory, filename);
		if (!fs.existsSync(ruleFilename) && !fs.existsSync(ruleFilename + '.js')) {
			ruleFilename = path.resolve(path.resolve(__dirname, '../rules'), filename);
		}

		return this.loadPlugin(ruleFilename);
	}

	/**
	 * A method for loading an importer or exporter object.
	 * @param filename the name of the importer or exporter file to load.
	 * @returns {*} the executable importer/exporter if it could be loaded.
	 * @private
	 */
	loadImporter(config) {

		if(config.filename) {
			if(this.ruleLoader.importersMap[config.filename]) {
				return this.ruleLoader.importersMap[config.filename];
			}
		}

		if (!config.scriptPath)
			throw("Importer/Exporter has no 'scriptPath' property.");

		let porterFilename = path.resolve(config.scriptPath);
		return this.loadPlugin(porterFilename);
	}

	/**
	 * A method for loading an importer or exporter object.
	 * @param filename the name of the importer or exporter file to load.
	 * @returns {*} the executable importer/exporter if it could be loaded.
	 * @private
	 */
	loadExporter(config) {

		if(config.filename) {
			if(this.ruleLoader.exportersMap[config.filename]) {
				return this.ruleLoader.exportersMap[config.filename];
			}
		}

		if (!config.scriptPath)
			throw("Importer/Exporter has no 'filename' property.");

		let porterFilename = path.resolve(config.scriptPath);
		return this.loadPlugin(porterFilename);
	}

	/**
	 * Load an executable plugin.
	 * @param filename the name of the plugin to load
	 * @returns {*} the executable plugin if it could be loaded.
	 * @private
	 */
	loadPlugin(filename) {
		let pluginClass;
		try {
			pluginClass = require(filename);
		}
		catch (e) {
			throw("Failed to load plugin " + filename + ".\n\tCause: " + e);
		}
		return pluginClass;
	}

	abortRun(reason) {

		if(this.abort) {
			return;
		}

		this.abort = true;

		if(this.sharedData) {
			this.sharedData.abort = true;
		}

		this.error('Aborting: ' + reason);
	}

	checkAbort(ruleID) {

		if(this.abort) {
			return;
		}

		let errorsToAbort = 1;

		let errorConfig = null;
		if(this.currentRuleset && this.currentRuleset.general) {
			errorConfig = this.currentRuleset.general.config;
		}

		if(errorConfig) {
			errorsToAbort = errorConfig.errorsToAbort;
		}

		if(errorsToAbort && errorsToAbort > 0 && this.logger.getCount(ErrorHandlerAPI.ERROR) >= errorsToAbort) {
			this.abortRun('Too many total errors. Got ' +
				this.logger.getCount(ErrorHandlerAPI.ERROR) + ' limit was ' + errorsToAbort);
			return;
		}

		if(errorConfig) {

			if (errorConfig.warningsToAbort && errorConfig.warningsToAbort > 0 &&
				this.logger.getCount(ErrorHandlerAPI.WARNING) >= errorConfig.warningsToAbort) {
				this.abortRun('Too many total warnings. Got ' +
					this.logger.getCount(ErrorHandlerAPI.WARNING) + ' limit was ' + errorConfig.warningsToAbort);
				return;
			}
		}

		if (this.currentRuleset && ruleID) {
			let rule = this.currentRuleset.getRuleById(ruleID);
			if (rule && rule.config) {
				if (rule.config.errorsToAbort && rule.config.errorsToAbort > 0 &&
					this.logger.getCount(ErrorHandlerAPI.ERROR, ruleID) >= rule.config.errorsToAbort) {
					this.abortRun('Too many errors for ' + rule.filename + '. Got ' +
						this.logger.getCount(ErrorHandlerAPI.ERROR, ruleID) + ' limit was ' + rule.config.errorsToAbort);
					return;
				}

				if (rule.config.warningsToAbort && rule.config.warningsToAbort > 0 &&
					this.logger.getCount(ErrorHandlerAPI.WARNING, ruleID) >= rule.config.warningsToAbort) {
					this.abortRun('Too many warnings for ' + rule.filename + '. Got ' +
						this.logger.getCount(ErrorHandlerAPI.WARNING, ruleID) + ' limit was ' + rule.config.warningsToAbort);
				}
			}

		}

	}

	/**
	 * This is called when the application has something to log.
	 * @param {string} level the level of the log. One of {@link Validator.ERROR}, {@link Validator.WARNING}, or {@link Validator.INFO}.
	 * If null or undefined
	 * then {@link Validator.INFO} is assumed.
	 * @param problemFileName {string} the name of the file causing the log to be generated. (ex. the rule's filename)
	 * @param problemDescription {string} a description of the problem encountered.
	 * @param ruleID the ID of the rule raising the log report or undefined if raised by some file other than a rule.
	 * @private
	 */
	log(level, problemFileName, ruleID, problemDescription) {

		if (this.logger) {
			this.logger.log(level, problemFileName, ruleID, problemDescription);
		} else {
			level = level || ErrorHandlerAPI.INFO;
			problemFileName = problemFileName || "";
			problemDescription = problemDescription || "";
			const dateStr = new Date().toLocaleString();
			console.log(level + ": " + dateStr + ": " + problemFileName + ": " + problemDescription);
		}

		this.checkAbort(ruleID);

	}

	/**
	 * Add an error to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	error(problemDescription) {
		this.log(ErrorHandlerAPI.ERROR, this.constructor.name, undefined, problemDescription);
	}

	/**
	 * Add a warning to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	warning(problemDescription) {
		this.log(ErrorHandlerAPI.WARNING, this.constructor.name, undefined, problemDescription);
	}

	/**
	 * Add an information report to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	info(problemDescription) {
		this.log(ErrorHandlerAPI.INFO, this.constructor.name, undefined, problemDescription);
	}
}
//search for processfile

module.exports = Validator;
