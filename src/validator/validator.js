/**
 * @private
 */
const fs = require('fs-extra');
const path = require("path");
const program = require("commander");
const stream = require('stream');

const rimraf = require('rimraf');

const BaseRuleAPI = require("../runtime/api/BaseRuleAPI");
const MetadataRuleAPI = require("../runtime/api/MetadataRuleAPI");

const Util = require("../utilities/Util");

const ErrorLogger = require("./ErrorLogger");
const MemoryWriterStream = require("../runtime/utilities/MemoryWriterStream");
const MemoryReaderStream = require("../runtime/utilities/MemoryReaderStream");
const RuleSet = require("./RuleSet");

const version = require("../../package.json").version;


const getCurrentDateTimeString = function() {
	const currentdate = new Date();
	return currentdate.getFullYear() + "_" +
		(currentdate.getMonth()+1) + "_" +
		currentdate.getDate() + "_" +
		currentdate.getHours() + "_" +
		currentdate.getMinutes() + "_" +
		currentdate.getSeconds();
}

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
			this.config.RulesetDirectory = this.rootDir;

		if (!fs.existsSync(this.config.RulesetDirectory))
			throw "Failed to find RulesetDirectory \"" + this.config.RulesetDirectory + "\".\n";

		if (this.config.RulesDirectory)
			this.config.RulesDirectory = path.resolve(this.rootDir, this.config.RulesDirectory);
		else
			this.config.RulesDirectory = this.config.RulesetDirectory;	// By default rules live with the rulesets.

		if (!fs.existsSync(this.config.RulesDirectory))
			throw "Failed to find RulesDirectory \"" + this.config.RulesDirectory + "\".\n";

		this.inputDirectory  = path.resolve(this.config.RootDirectory, this.config.InputDirectory);
		this.outputDirectory = path.resolve(this.config.RootDirectory, this.config.OutputDirectory);
		this.logDirectory = path.resolve(this.config.RootDirectory, this.config.LogDirectory);
		this.runsDirectory = path.resolve(this.config.RootDirectory, this.config.RunsDirectory);

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

		if (!this.outputFileName) {
			this.warning("No output file specified.");
		}


		if(ruleset.import) {

			this.inputFileName = this.getTempName(this.config);

			this.importFile(ruleset.import, this.inputFileName, rulesDirectory).then( () => {
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
					this.error("Failed to import file: " + e);
					this.finishRun();
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

		if (!rules || rules.lenth == 0) {
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
			this.saveResults(lastResult);
			this.cleanup();
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
				throw("Rule will not accept the data.");	// Should never happen. All cases should be covered above.
		}
		catch (e) {
			const errorMsg = `${this.RuleSetName}: Rule: "${this.RuleName}" failed.\n\t${e}`;
			if (rule.shouldRulesetFailOnError())
				throw errorMsg;	// Failed so bail.
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
			const tempFileName = this.getTempName(this.config);
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

	saveResults(results) {

		if (results && this.outputFileName) {
			if (results.data)
				this.saveFile(results.data, this.outputFileName, this.encoding);
			else if (results.stream)
				this.putFile(results.stream, this.outputFileName, this.encoding);
			else
				this.putFile(results.file, this.outputFileName);
		}

		this.finishRun();
	}

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
	getTempName(config) {
		const dirname = (config && config.TempDirectory) || this.tempDir;
		const filename = Util.createGUID();
		return path.resolve(dirname, filename);
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

	saveRuleSet(ruleset) {
		fs.writeFileSync(path.resolve(this.config.RulesetDirectory, ruleset.filename + ".json"), JSON.stringify(ruleset.toJSON()), 'utf8');
	}

	finishRun() {

		const runId = path.basename(this.inputFileName, path.extname(this.inputFileName)) + '_' + getCurrentDateTimeString() + ".run.json";

		if(this.currentRuleset.export) {

			let resolveOutputFN = null;
			if(this.outputFileName) {
				resolveOutputFN = path.resolve(this.outputDirectory, this.outputFileName)
			}

			this.exportFile(this.currentRuleset.export, resolveOutputFN, this.rulesDirectory, runId)
				.then(() => {},

				(error) => {
					this.error("Export failed: " + error)	;
				})
				.catch((e) => {
					this.error("Export" + importConfig.FileName + " fail unexpectedly: " + e);
				})
				.then(() => {
					this.saveRun(runId);
				});
		} else {
			this.saveRun(runId);
		}

	}

	saveRun(runId) {
		try {
			if (!fs.existsSync(this.runsDirectory))
				fs.mkdirSync(this.runsDirectory);	// Make sure the logDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.runsDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
			throw e;
		}

		const logName = this.saveLog(this.inputFileName);

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

		const basename = path.basename(filename, path.extname(filename)) + '_' + getCurrentDateTimeString() + ".log.json";

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
				fs.mkdirSync(this.outputDirectory);	// Make sure the inputDirectory exists.
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
				fs.mkdirSync(this.outputDirectory);	// Make sure the inputDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\".\n" + e);	// Can't create the inputDirectory to write to, so can't use this logger.
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

	importFile(importConfig, targetFilename, rulesDirectory) {

		return new Promise((resolve, reject) => {
			var ruleClass = this.loadRule(importConfig.FileName, rulesDirectory);

			if(!ruleClass) {
				return reject("Could not find importer " + importConfig.FileName);
			}

			if(!ruleClass.importFile) {
				return reject("Importer " + importConfig.FileName + " does not have importFile method");
			}

			ruleClass.importFile(targetFilename, importConfig.Config).then(function() {
					resolve();
				}, error => {
					reject("Importer " + importConfig.FileName + " failed: " + error);
				})
				.catch((e) => {
					reject("Importer" + importConfig.FileName + " fail unexpectedly: " + e);
				});



		});
	}

	exportFile(exportConfig, filename, rulesDirectory, runId) {
		return new Promise((resolve, reject) => {

			let outputFileName = filename;

			if(!fs.existsSync(filename)) {
				outputFileName = null;
			}

			var ruleClass = this.loadRule(exportConfig.FileName, rulesDirectory);

			if(!ruleClass) {
				return reject("Could not find exporter " + exportConfig.FileName);
			}

			if(!ruleClass.exportFile) {
				return reject("Exporter " + exportConfig.FileName + " does not have exportFile method");
			}

			ruleClass.exportFile(outputFileName, exportConfig.Config, runId, this.logger.getLog()).then(function() {
					resolve();
				}, error => {
					reject("Importer " + exportConfig.FileName + " failed: " + error);
				})
				.catch((e) => {
					reject("Importer" + exportConfig.FileName + " fail unexpectedly: " + e);
				});

		});
	}

	loadRule(filename, rulesDirectory){
		if (!filename)
			throw("Rule has no 'FileName'.");

		// Find the rule file.

		let ruleFilename = path.resolve(path.resolve(__dirname, '../runtime/rules'), filename);
		if(!fs.existsSync(ruleFilename + '.js')) {
			ruleFilename = path.resolve(rulesDirectory, filename);
		}

		let ruleClass;
		try {
			ruleClass = require(ruleFilename);
		}
		catch (e) {
			throw("Failed to load rule " + filename + ".\n\tCause: " + e + "\n\tFull Path: " + ruleFilename);
		}
		return ruleClass;
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

	// If the input or output are not set they'll be grabbed from the ruleset file.
	let inputFile = program.input ? path.resolve(program.input) : undefined;
	let outputFile = program.output;
	let inputEncoding = program.encoding;

	config.scriptName = scriptName;
	const validator = new Validator(config);

	// TODO: Remove this log message once there are more reasonable log messages.
	if (!validator.logger) {
		console.error("Failed to initialize any reporting plug-in.");
		process.exit(1);
	}

	try {
		validator.runRuleset(inputFile, outputFile, inputEncoding);
		// console.log("Done.");
		// process.exit(0);
	}
	catch (e) {
		console.log("Failed.\n\t" + e);
		validator.error("Failed: " + e);
		validator.finishRun();	// Write the log.
		process.exit(1);
	}

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
	});
}

module.exports = Validator;
