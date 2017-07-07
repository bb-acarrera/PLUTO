/**
 * @private
 */
const fs = require('fs-extra');
const path = require("path");
const program = require("commander");
const rimraf = require('rimraf');
const stream = require('stream');

const BaseRuleAPI = require("../runtime/api/BaseRuleAPI");
const MetadataRuleAPI = require("../runtime/api/MetadataRuleAPI");

const Util = require("../utilities/Util");

const ErrorLogger = require("./ErrorLogger");
const MemoryWriterStream = require("../runtime/utilities/MemoryWriterStream");
const MemoryReaderStream = require("../runtime/utilities/MemoryReaderStream");
const RuleSet = require("./RuleSet");

const version = '0.1'; //require("../../package.json").version;


/*
 * The Validator class is the main application class.
 */
class Validator {
	/*
	 * The <em>private</em> validator constructor.
	 * @param config
	 * @private
	 */
	constructor(config) {
		this.config = config || {};

		this.rootDir = Util.getRootDirectory(this.config);

		if (!fs.existsSync(this.rootDir))
			throw "Failed to find RootDirectory \"" + this.rootDir + "\".\n";

		if (this.config.RulesetDirectory)
			this.config.RulesetDirectory = path.resolve(this.rootDir, this.config.RulesetDirectory);
		else
			this.config.RulesetDirectory = path.resolve('runtime/rulesets');

		if (!fs.existsSync(this.config.RulesetDirectory))
			throw "Failed to find RulesetDirectory \"" + this.config.RulesetDirectory + "\".\n";

		if (this.config.RulesDirectory)
			this.config.RulesDirectory = path.resolve(this.rootDir, this.config.RulesDirectory);
		else
			this.config.RulesDirectory = this.config.RulesetDirectory;	// By default rules live with the rulesets.

		if (!fs.existsSync(this.config.RulesDirectory))
			throw "Failed to find RulesDirectory \"" + this.config.RulesDirectory + "\".\n";

		this.inputDirectory  = path.resolve(this.rootDir, this.config.InputDirectory || "");
		this.outputDirectory = path.resolve(this.rootDir, this.config.OutputDirectory);
		this.logDirectory = path.resolve(this.rootDir, this.config.LogDirectory);
		this.runsDirectory = path.resolve(this.rootDir, this.config.RunsDirectory);

		if (!fs.existsSync(this.outputDirectory))
			fs.mkdirSync(this.outputDirectory);	// Make sure the outputDirectory exists.

		this.logger = new ErrorLogger(config);
		this.ruleIterator = null;

		// Remember the name of the current ruleset and rule for error reporting.
		this.RuleSetName = undefined;
		this.RuleName = undefined;

		// Data that can be shared between rules.
		this.SharedData = {};

		this.updateConfig(this.config);
	}

	/*
	 * Run the ruleset, as defined by the config file, over the inputFile producing the outputFile.
	 */
	runRuleset(inputFile, outputFile, inputEncoding) {
		this.running = true;	// Used by finishRun() to determine if it should clean up. Avoids issues with finishRun() being called twice.

		var ruleset;
		try {
			this.tempDir = Util.getTempDirectory(this.config, this.rootDir);

			ruleset = Util.retrieveRuleset(this.config.RulesetDirectory || this.rootDir, this.config.RuleSet, this.config.RuleSetOverride);
		}
		catch (e) {
			this.error(e);
			throw e;
		}

		let rulesDirectory;
		if (ruleset.rulesDirectory)
			rulesDirectory = path.resolve(this.config.RulesetDirectory, ruleset.rulesDirectory);
		else
			rulesDirectory = this.config.RulesDirectory || this.config.RulesetDirectory;



		this.RuleSetName = ruleset.name || "Unnamed";

		this.outputFileName = outputFile;
		this.encoding = inputEncoding || 'utf8';
		this.currentRuleset = ruleset;
		this.rulesDirectory = rulesDirectory;

		if (!this.outputFileName && (!ruleset.export || !ruleset.export.Config || !ruleset.export.Config.file)) {
			this.warning("No output file specified.");
		}

		if (ruleset.export) {
			// Override the file in the ruleset with the one specified on the command line.
			if (outputFile && ruleset.export.Config)
				ruleset.export.Config.file = outputFile;
		}

		if(ruleset.import) {
			// Override the file in the ruleset with the one specified on the command line.
			if (inputFile && ruleset.import.Config)
				ruleset.import.Config.file = inputFile;

			this.inputFileName = this.getTempName();

			this.importFile(ruleset.import, this.inputFileName).then( () => {
					try {
						this.runRules(rulesDirectory, ruleset.rules, this.inputFileName);
					}
					catch (e) {
						this.error("Ruleset \"" + this.RuleSetName + "\" failed.\n\t" + e);
						throw e;
					}

				},error => {
					this.error("Failed to import file: " + error);
					this.finishRun();
				})
				.catch((e) => {
					this.finishRun();
					throw e;
				});
		} else {
			this.inputFileName = inputFile;
			if (!this.inputFileName)
				throw "No input file specified.";

			try {
				this.runRules(rulesDirectory, ruleset.rules, this.inputFileName);
			}
			catch (e) {
				this.error("Ruleset \"" + this.RuleSetName + "\" failed.\n\t" + e);
				throw e;
			}
		}

	}

	/*
	 * Run the list of rules that are all in the same rulesDirectory, starting with the given file.
	 * (The output from a rule will generally be a new file which is input to the next rule.)
	 */
	runRules(rulesDirectory, rules, file) {

		if (!fs.existsSync(file))
			throw "Input file \"" + file + "\" does not exist.";

		if (!rules || rules.length == 0) {
			this.warning("Ruleset \"" + this.RuleSetName + "\" contains no rules.");
			return;
		}

		// As a first step get the file locally. Do this to simplify running the rules (they
		// all run locally) and make sure the data is all available at the start of the process.
		const localFileName = this.getTempName();
		this.getFile(file, localFileName);
		let currentResult = { file : localFileName };

		function makeIterator(rules) {
			var nextIndex = 0;

			return {
				next: function() {
					return nextIndex < rules.length ? rules[nextIndex++] : null;
				},
				index: function() {
					return nextIndex-1;
				}
			};
		}
		this.ruleIterator = makeIterator(rules);

		this.runRule(rulesDirectory, this.ruleIterator.next(), currentResult);
	}

	runRule(rulesDirectory, ruleDescriptor, lastResult) {
		if (!ruleDescriptor || this.shouldAbort) {	// "shouldAbort" is set in the "log" method.
			// No more rules, so done.
			this.finishRun(lastResult);
			console.log("Done.");


			//TODO: track down why the process is still active when we hit this point in debugger
			//console.log(process._getActiveHandles());

			return;
		}

		var ruleClass = this.loadRule(ruleDescriptor.filename, rulesDirectory);


		// Get the rule's config.
		let config = ruleDescriptor.config || {};
		if (typeof config === 'string') {
			try {
				config = path.resolve(rulesDirectory, config);
				config = require(config);
				if (!config.Config)
					throw(this.constructor.name, "Config file \"" + config + "\" does not contain a Config member.");
				config = config.Config;
			}
			catch (e) {
				throw(this.constructor.name, "Failed to load rule config file \"" + config + "\".\n\tCause: " + e);
			}
		}

		// Set the validator so that the rule can report errors and such.
		this.updateConfig(config);
		config.Name = config.Name || ruleDescriptor.filename;
		this.RuleName = config.Name;

		const rule = new ruleClass.instance(config);

		// Try to match the input method to the data. i.e. a rule could support multiple import approaches
		// so we don't want to unnecessarily convert the data.
		try {
			if (typeof rule.updateMetadata === 'function') {
				rule.updateMetadata();
				this.runRule(rulesDirectory, this.ruleIterator.next(), lastResult);
			}
			else if (rule.canUseMethod() && lastResult.data)			// No conversion necessary.
				this.runMethodsRule(rulesDirectory, rule, lastResult);
			else if (rule.canUseStreams() && lastResult.stream)	// No conversion necessary.
				this.runStreamsMethod(rulesDirectory, rule, lastResult);
			else if (rule.canUseFiles() && lastResult.file)		// No conversion necessary.
				this.runFilesRule(rulesDirectory, rule, lastResult);

			else if (rule.canUseFiles())	// Conversion necessary.
				this.runFilesRule(rulesDirectory, rule, lastResult);
			else if (rule.canUseStreams())	// Conversion necessary.
				this.runStreamsMethod(rulesDirectory, rule, lastResult);
			else if (rule.canUseMethod())	// Conversion necessary.
				this.runMethodsRule(rulesDirectory, rule, lastResult);

			else
				throw(`Rule '${this.RuleName}' will not accept the data from the last rule.`);	// Should never happen. All cases should be covered above.
		}
		catch (e) {
			const errorMsg = `${this.RuleSetName}: Rule: "${this.RuleName}" failed.\n\t${e}`;
			if (rule.shouldRulesetFailOnError()) {
				this.error(errorMsg);
				throw errorMsg;	// Failed so bail.
			}
			else {
				this.warning(errorMsg);
				this.runRule(rulesDirectory, this.ruleIterator.next(), lastResult);	// Failed but continue.
			}
		}
	}

	runMethodsRule(rulesDirectory, rule, lastResult) {
		// Send the output on to the next rule.
		rule.on(BaseRuleAPI.NEXT, (data) => {
			// The rule may have changed the file encoding.
			this.encoding = rule.config.OutputEncoding;

			this.runRule(rulesDirectory, this.ruleIterator.next(), { data: data });
		});

		if (lastResult.data)
			rule.useMethod(lastResult.data);
		else if (lastResult.file) {	// Should always be true when the first case is false.
			// Read the file and pass the data to the method.
			const data = this.loadFile(lastResult.file, this.encoding);	// lastResult.file should always be an absolute path.
			rule.useMethod(data);
		}
		else if (lastResult.stream) {
			// The last rule output to a stream but the new rule requires the data in memory. So write the
			// stream into memory and when done call the next rule.
			const writer = new MemoryWriterStream();
			writer.once("finish", () => {
				rule.useMethod(writer.getData(this.encoding));
			});
			lastResult.stream.pipe(writer);
		}
		else
			throw "Rule cannot read data.";
	}

	runFilesRule(rulesDirectory, rule, lastResult) {
		// Send the output on to the next rule.
		rule.on(BaseRuleAPI.NEXT, (filename) => {
			// The rule may have changed the file encoding.
			this.encoding = rule.config.OutputEncoding;

			this.runRule(rulesDirectory, this.ruleIterator.next(), { file: filename });
		});

		if (lastResult.file)
			rule.useFiles(lastResult.file);
		else if (lastResult.data) {	// Should always be true when the first case is false.
			// Write the data to a temporary file and pass the filename to the method.
			rule.useFiles(this.saveLocalTempFile(lastResult.data, this.encoding))
		}
		else if (lastResult.stream) {
			// The last rule output to a stream but the new rule requires the data in a file. So write the
			// stream into a file and when done call the next rule.
			const tempFileName = this.getTempName();
			const writer = fs.createWriteStream(tempFileName);
			writer.once("finish", () => {
				rule.useFiles(tempFileName);
			});
			lastResult.stream.pipe(writer);
		}
		else
			throw "Rule cannot read data.";
	}

	runStreamsMethod(rulesDirectory, rule, lastResult) {
		// Send the output on to the next rule.
		rule.on(BaseRuleAPI.NEXT, (stream) => {
			// The rule may have changed the file encoding.
			this.encoding = rule.config.OutputEncoding;

			this.runRule(rulesDirectory, this.ruleIterator.next(), { stream: stream });
		});

		if (lastResult.stream)
			rule.useStreams(lastResult.stream, new stream.PassThrough());
		else if (lastResult.data)
			rule.useStreams(new MemoryReaderStream(lastResult.data), new stream.PassThrough());
		else if (lastResult.file)
			rule.useStreams(fs.createReadStream(lastResult.file), new stream.PassThrough());
		else
			throw "Rule cannot read data.";
	}

	/**
	 * Save the results to a local file.
	 * @param results a results object from a ruleset run.
	 * @private
	 */
	saveResults(results) {

		if (results && this.outputFileName) {
			if (results.data)
				this.saveFile(results.data, this.outputFileName, this.encoding);
			else if (results.stream)
				this.putFile(results.stream, this.outputFileName, this.encoding);
			else
				this.putFile(results.file, this.outputFileName);
		}
	}

	/**
	 * Do necessary finishing work at the completion of a run. This work includes using the export plug-in, if one
	 * was specified, to export the result file, and then calls {@link saveRunRecord} to save the run record.
	 * @param results a results object from a ruleset run.
	 * @private
	 */
	finishRun(results) {
		if (!this.running)
			return;

		this.running = false;
		
		const runId = path.basename(this.inputFileName, path.extname(this.inputFileName)) + '_' + Util.getCurrentDateTimeString() + ".run.json";

		if(this.currentRuleset.export) {
			var resultsFile = null;
			if (results && results.data) {
				resultsFile = this.getTempName();
				this.saveFile(results.data, resultsFile, this.encoding);
			}
			else if (results && results.stream) {
				resultsFile = this.getTempName();
				this.putFile(results.stream, resultsFile, this.encoding);
			}
			else if (results)
				resultsFile = results.file;

			this.exportFile(this.currentRuleset.export, resultsFile, runId)
				.then(() => {},

					(error) => {
						this.error("Export failed: " + error)	;
					})
				.catch((e) => {
					this.error("Export" + importConfig.FileName + " fail unexpectedly: " + e);
				})
				.then(() => {
					this.saveRunRecord(runId, this.saveLog(this.inputFileName));
					this.cleanup();
				});
		} else if (results) {
			this.saveResults(results);
			this.saveRunRecord(runId, this.saveLog(this.inputFileName));
			this.cleanup();
		}
		else {
			this.saveRunRecord(runId, this.saveLog(this.inputFileName));
			this.cleanup();
		}

	}

	/**
	 * This method saves record which is used by the client code to reference files for any particular run.
	 * @param runId the unique ID of the run.
	 * @param logName the name of the log file
	 * @returns {{id: *, log: *, ruleset: (undefined|*|string), inputfilename: *, outputfilename: *, time: Date}}
	 * @private
	 */
	saveRunRecord(runId, logName) {
		try {
			if (!fs.existsSync(this.runsDirectory))
				fs.mkdirSync(this.runsDirectory);	// Make sure the logDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.runsDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
			throw e;
		}

		const run = {
			id: runId,
			log: logName,
			ruleset: this.RuleSetName,
			inputfilename: this.inputFileName,
			outputfilename: this.outputFileName,
			time: new Date()
		};


		fs.writeFileSync(path.resolve(this.runsDirectory, runId), JSON.stringify(run), 'utf8');

		return run;
	}

	/**
	 * Clean up any temporary artifacts.
	 * @private
	 */
	cleanup() {
		// Remove the temp directory and contents.

		try {
			rimraf.sync(this.tempDir, null, (e) => {
				this.error('Unable to delete folder: ' + this.tempDir + '.  Reason: ' + e);
			});
		} catch (e) {
			this.error('Unable to delete folder: ' + this.tempDir + '.  Reason: ' + e);
		}


	}

	// Add some useful things to a config object.
	updateConfig(config) {
		config.RootDirectory = config.RootDirectory || this.rootDir;
		config.TempDirectory = config.TempDirectory || this.tempDir;
		config.OutputEncoding = config.Encoding || this.encoding;
		config.Encoding = this.encoding;
		config.validator = this;
		config.SharedData = this.SharedData;
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
	 * This file saves the given ruleset to a file in the configured Ruleset directory. The name of the file is
	 * taken from the ruleset's 'filename' property with '.json' appended to it by this function and if a file with
	 * that name already exists it will be overwritten. The file is written using 'utf8'.
	 * @param ruleset the ruleset to write.
	 * @private
	 */
	saveRuleSet(ruleset) {
		fs.writeFileSync(path.resolve(this.config.RulesetDirectory, ruleset.filename + ".json"), JSON.stringify(ruleset.toJSON()), 'utf8');
	}

	/**
	 * This method is used by the application to save the log of results for the given file synchronously.
	 * @param filename {string} the name of the file to save.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 * @private
	 */
	saveLog(filename) {
		try {
			if (!fs.existsSync(this.logDirectory))
				fs.mkdirSync(this.logDirectory);	// Make sure the logDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.logDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
			throw e;
		}

		const basename = path.basename(filename, path.extname(filename)) + '_' + Util.getCurrentDateTimeString() + ".log.json";

		fs.writeFileSync(path.resolve(this.logDirectory, basename), JSON.stringify(this.logger.getLog()), 'utf8');

		return basename;
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

		if (typeof fileNameOrStream === 'string') {
			fs.copySync(fileNameOrStream, path.resolve(this.outputDirectory, remoteFileName));
		}
		else {
			const dst = fs.createWriteStream(path.resolve(this.outputDirectory, remoteFileName));
			fileNameOrStream.pipe(dst);
		}
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
	 * This method is used by the application to get an in-memory copy of a log file managed by
	 * the plugin.
	 * @param logFileName {string} the name of the log file to retrieve.
	 * @returns {string} the contents of the log file.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @private
	 */
	getLog(logFileName) {
		const logfile = path.resolve(this.logDirectory, logFileName);
		var log;
		if (fs.existsSync(logfile)) {
			const contents = fs.readFileSync(logfile, 'utf8');
			try {
				log = JSON.parse(contents);
			}
			catch (e) {
				console.log(`Failed to load ${configName}. Attempt threw:\n${e}\n`);
			}
		}
		return log;
	}

	/**
	 * This method is used by the application to get an in-memory copy of a run managed by
	 * the plugin.
	 * @param runFileName {string} the name of the run file to retrieve.
	 * @returns {string} the contents of the run file.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @private
	 */
	getRun(runFileName) {
		const runfile = path.resolve(this.runsDirectory, runFileName);
		var run;
		if (fs.existsSync(runfile)) {
			const contents = fs.readFileSync(runfile, 'utf8');
			try {
				run = JSON.parse(contents);
			}
			catch (e) {
				console.log(`Failed to load ${configName}. Attempt threw:\n${e}\n`);
			}
		}
		return run;
	}

	/**
	 * This method is used by the application to get an in-memory copy of all runs managed by
	 * the plugin.
	 * @returns {array} list of the run file.
	 * @private
	 */
	getRuns() {

		var runs = [];

		fs.readdirSync(this.runsDirectory).forEach(file => {
			if(file.substr(file.length-8) === 'run.json') {
				runs.push(file);
			}
		});

		return runs;
	}

	/**
	 * This method return a Promise that loads an importer plugin and then uses that plugin to import a file.
	 * @param importConfig the configuration identifying the import plugin and the file to import.
	 * @param targetFilename the final name for the imported file.
	 * @returns {Promise} the Promise object that attempts to load the importer and import a file.
	 * @private
	 */
	importFile(importConfig, targetFilename) {

		return new Promise((resolve, reject) => {
			var importerClass = this.loadImporterExporter(importConfig.ScriptPath);

			if(!importerClass) {
				reject("Could not find importer " + importConfig.ScriptPath);
				return;
			}

			let importer = new importerClass(importConfig.Config);

			if(!importer.importFile) {
				reject("Importer " + importConfig.ScriptPath + " does not have importFile method");
				return;
			}

			importer.importFile(targetFilename).then(function() {
					resolve();
				}, error => {
					reject("Importer " + importConfig.ScriptPath + " failed: " + error);
				})
				.catch((e) => {
					reject("Importer" + importConfig.ScriptPath + " fail unexpectedly: " + e);
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

			if (!filename) {
				reject(`Exporter ${exportConfig.ScriptPath} failed: no filename specified.`);
				return;
			}
			else if(!fs.existsSync(filename)) {
				reject(`Exporter ${exportConfig.ScriptPath} failed: ${filename} does not exist.`);
				return;
			}

			var exporterClass = this.loadImporterExporter(exportConfig.ScriptPath);

			if(!exporterClass) {
				reject("Could not find exporter " + exportConfig.ScriptPath);
				return;
			}

			let exporter = new exporterClass(exportConfig.Config);

			if(!exporter.exportFile) {
				reject("Exporter " + exportConfig.ScriptPath + " does not have exportFile method");
				return;
			}

			exporter.exportFile(filename, runId, this.logger.getLog()).then(function() {
					resolve();
				}, error => {
					reject("Exporter " + exportConfig.ScriptPath + " failed: " + error);
				})
				.catch((e) => {
					reject("Exporter" + exportConfig.ScriptPath + " fail unexpectedly: " + e);
				});

		});
	}

	/**
	 * A method for loading a rule object.
	 * @param filename the name of the rule file to load.
	 * @param rulesDirectory the directory rules are kept in. If this is <code>null</code> then an attempt is made
	 * to resolve the filename against the current working directory. If the rule does not exist in either location
	 * then an attempt is made to load the plugin from '../runtime/rules' relative to the current working directory.
	 * @returns {*} the executable rule if it could be loaded.
	 * @private
	 */
	loadRule(filename, rulesDirectory) {
		if (!filename)
			throw("Rule has no filename.");

		// Find the rule file.

		let ruleFilename = rulesDirectory === undefined ? path.resolve(filename) : path.resolve(rulesDirectory, filename);
		if(!fs.existsSync(ruleFilename + '.js')) {
			ruleFilename = path.resolve(path.resolve(__dirname, '../runtime/rules'), filename);
		}

		return this.loadPlugin(ruleFilename);
	}

	/**
	 * A method for loading an importer or exporter object.
	 * @param filename the name of the importer or exporter file to load.
	 * @returns {*} the executable importer/exporter if it could be loaded.
	 * @private
	 */
	loadImporterExporter(filename) {
		if (!filename)
			throw("Importer/Exporter has no filename.");

		let porterFilename = path.resolve(filename);
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
			throw("Failed to load rule " + filename + ".\n\tCause: " + e);
		}
		return pluginClass;
	}

	/**
	 * This is called when the application has something to log.
	 * @param {string} level the level of the log. One of {@link Validator.ERROR}, {@link Validator.WARNING}, or {@link Validator.INFO}.
	 * If null or undefined
	 * then {@link Validator.INFO} is assumed.
	 * @param problemFileName {string} the name of the file causing the log to be generated. (ex. the rule's filename)
	 * @param problemDescription {string} a description of the problem encountered.
	 * @param ruleID the ID of the rule raising the log report or undefined if raised by some file other than a rule.
	 * @param shouldAbort should the running of rules stop at the end of the current rule,
	 * @private
	 */
	log(level, problemFileName, ruleID, problemDescription, shouldAbort) {
		this.shouldAbort = shouldAbort || false;
		if (this.logger)
			this.logger.log(level, problemFileName, ruleID, problemDescription);
		else {
			level = level || BaseRuleAPI.INFO;
			problemFileName = problemFileName || "";
			problemDescription = problemDescription || "";
			const dateStr = new Date().toLocaleString();
			console.log(level + ": " + dateStr + ": " + problemFileName + ": " + problemDescription);
		}
	}

	/**
	 * Add an error to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	error(problemDescription) {
		this.log(BaseRuleAPI.ERROR, this.constructor.name, undefined, problemDescription);
	}

	/**
	 * Add a warning to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	warning(problemDescription) {
		this.log(BaseRuleAPI.WARNING, this.constructor.name, undefined, problemDescription);
	}

	/**
	 * Add an information report to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	info(problemDescription) {
		this.log(BaseRuleAPI.INFO, this.constructor.name, undefined, problemDescription);
	}
}

let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the validator or the server? Only do the following if running as a validator.
	program
		.version(version)
		.usage('[options]')
		.description('Validate an input file.')
		.option('-c, --config <configFile>', 'The configuration file to use.')
		.option('-e, --encoding [encoding]', 'The encoding to use to load the input file. [utf8]', 'utf8')
		.option('-i, --input <filename>', 'The name of the input file.')
		.option('-o, --output <filename>', 'The name of the output file.')
		.option('-r, --ruleset <rulesetFile>', 'The ruleset file to use.')
		.option('-v, --rulesetoverride <rulesetOverrideFile>', 'The ruleset overrides file to use.')
		.parse(process.argv);

	if (!program.config)
		program.help((text) => {
			return "A configuration file must be specified.\n" + text;
		});

	if (!fs.existsSync(program.config)) {
		console.log("Failed to find configuration file \"" + program.config + "\".\n");
		process.exit(1);
	}

	let config;
	try {
		config = require(path.resolve(__dirname, program.config));
	}
	catch (e) {
		console.log("The configuration file cannot be loaded.\n" + e);
		process.exit(1);
	}

	config.RuleSet = program.ruleset || config.RuleSet;
	if (!config.RuleSet)
		program.help((text) => {
			return "A ruleset must be specified either as an argument or a property in the config. file.\n" + text;
		});

	if(program.rulesetoverride) {
		config.RuleSetOverride = program.rulesetoverride;
	}

	// If the input or output are not set they'll be grabbed from the ruleset file later.
	let inputFile = program.input ? path.resolve(program.input) : undefined;
	let outputFile = program.output;
	let inputEncoding = program.encoding;

	config.scriptName = scriptName;
	const validator = new Validator(config);

	process.on('uncaughtException', (err) => {
		// Caught an uncaught exception so something went extraordinarily wrong.
		// Log the error and then give up. Do not attempt to write the output file because we have no idea
		// how many rules have been run on it or what state it is in.
		if (err) {
			if (typeof err == 'string') {
				validator.error(err);	// Record the uncaught exception.
				console.log("Exiting with uncaught exception: " + err);
			}
			else if (err.message) {
				validator.error(err.message);
				console.log("Exiting with uncaught exception: " + err.message);
			}
			else {
				validator.error(JSON.stringify(err));	// No idea what this is but try to represent it as best we can.
				console.log("Exiting with uncaught exception: " + JSON.stringify(err));
			}
		}
		else {
			validator.error(`Unspecified error. Last rule attempted was ${validator.RuleName} in ruleset ${validator.RuleSetName}.`)
			console.log("Exiting with unspecified error.");
		}

		validator.finishRun();	// Write the log.
		process.exit(1);	// Quit.
	}).on('unhandledRejection', (reason, p) => {
		console.error(reason, 'Unhandled Rejection at Promise', p);

		// validator.finishRun();	// Write the log.
		process.exit(1);	// Quit.
	});

	try {
		validator.runRuleset(inputFile, outputFile, inputEncoding);
	}
	catch (e) {
		console.log("Failed.\n\t" + e);
		validator.error("Failed: " + e);
		validator.finishRun();	// Write the log.
		process.exit(1);
	}
}

module.exports = Validator;
