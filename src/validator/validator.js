/**
 * @private
 */
const fs = require("fs");
const path = require("path");
const program = require("commander");
const stream = require('stream');

const DataAPI = require("../api/DataAPI");
const RuleAPI = require("../api/RuleAPI");

const Util = require("../utilities/Util");

const ErrorLogger = require("./ErrorLogger");
const MemoryWriterStream = require("./MemoryWriterStream");
const MemoryReaderStream = require("./MemoryReaderStream");

const version = require("../../package.json").version;

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
		this.rootDir = this.getRootDirectory();

		// Make a few relative paths absolute for ease of use.
		if (this.config.PluginsDirectory)
			this.config.PluginsDirectory = path.resolve(this.rootDir, this.config.PluginsDirectory);
		else
			this.config.PluginsDirectory = this.rootDir;

		if (this.config.RulesetDirectory)
			this.config.RulesetDirectory = path.resolve(this.rootDir, this.config.RulesetDirectory);
		else
			this.config.RulesetDirectory = this.rootDir;

		if (this.config.RulesDirectory)
			this.config.RulesDirectory = path.resolve(this.rootDir, this.config.RulesDirectory);
		else
			this.config.RulesDirectory = this.config.RulesetDirectory;	// By default rules live with the rulesets.

		this.logger = new ErrorLogger(config);
		this.dataAccessor = this.createDataAccessor();
		this.ruleIterator = null;

		// Remember the name of the current ruleset and rule for error reporting.
		this.RuleSetName = undefined;
		this.RuleName = undefined;

		this.updateConfig(this.config);
	}

	getRootDirectory() {
		if (this.rootDir !== undefined)
			return this.rootDir;

		// Get the root directory for everything.
		let rootDir = path.dirname(this.config.scriptName);	// Default is the directory this script lives in.
		if (this.config.RootDirectory) {
			rootDir = this.config.RootDirectory;	// Don't check for read/write/exist as this leads to possible race conditions later. Instead check at time of access.
			if (!rootDir.endsWith(path.sep))
				rootDir = rootDir + path.sep;
		}
		return rootDir;
	}

	getTempDirectory() {
		let tmpDir = path.resolve(this.getRootDirectory(), "tmp");
		if (this.config.TempDirectory) {
			let basename = path.basename(this.config.scriptName, ".js");
			tmpDir = path.resolve(this.config.TempDirectory, basename + this.createGUID());
		}

		for (;;) {
			try {
				fs.mkdirSync(tmpDir);
				break;
			}
			catch (e) {
				// Already exists so add something to make it more unique.
				tmpDir = tmpDir + '-' + 'a';
			}
		}
		return tmpDir;
	}

	createDataAccessor() {
		return this.createPlugin("DataAPI", "DefaultData");
	}

	createPlugin(pluginType, defaultClass) {
		let plugin;
		let pluginsConfig = this.config.Plugins;
		if (pluginsConfig) {
			let pluginConfig = pluginsConfig[pluginType];
			if (pluginConfig) {
				let pluginName = pluginConfig.FileName;
				let pluginLocalConfig = pluginConfig.Config || {};

				// Share the root directory with the plugin.
				this.updateConfig(pluginLocalConfig);
				if (pluginName) {
					try {
						// Don't check that the plugin script exists before trying to load it. Instead just throw if it doesn't exist.
						let script = require(path.resolve(this.config.PluginsDirectory, pluginName));
						plugin = new script.instance(pluginLocalConfig);
					}
					catch (e) {
						this.error("Failed to load \"" + pluginName + ". Using the default plugin \"" + defaultClass + "\".\n" + e);
					}
				}
			}
		}

		if (!plugin) {
			let defaultPlugin = require("../default/" + defaultClass);

			if (defaultPlugin) {
				plugin = new defaultPlugin.instance();
			}
		}

		return plugin;
	}

	/*
	 * Run the ruleset, as defined by the config file, over the inputFile producing the outputFile.
	 */
	runRuleset(inputFile, outputFile, inputEncoding) {
		this.tempDir = this.getTempDirectory();

		var ruleset;
		try {
			ruleset = Util.retrieveRuleset(this.config.RulesetDirectory || this.config.RootDirectory, this.config.RuleSet);
		}
		catch (e) {
			this.error(e);
			return;
		}

		let rulesDirectory;
		if (ruleset.RulesDirectory)
			rulesDirectory = path.resolve(this.config.RulesetDirectory, ruleset.RulesDirectory);
		else
			rulesDirectory = this.config.RulesetDirectory;

		this.RuleSetName = ruleset.Name || "Unnamed";
		this.inputFileName = inputFile || ruleset.SourceFileName;	// A commandline filename will override one specified in the config file.
		this.outputFileName = outputFile || ruleset.ResultsFileName;
		this.encoding = inputEncoding || ruleset.Encoding || 'utf8';	// The initial encoding for the input file. Rules may change this.

		if (!this.inputFileName)
			throw "No input file specified.";
		if (!this.outputFileName)
			this.warning("No output file specified.");

		const rules = ruleset.Rules;
		if (!rules) {
			this.warning("Ruleset \"" + this.RuleSetName + "\" contains no rules.");
			return;
		}

		if( Object.prototype.toString.call( rules ) !== '[object Array]' ) {
			this.warning("Ruleset \"" + this.RuleSetName + "\": Rules must be an array of rules.");
			return;
		}

		try {
			this.runRules(rulesDirectory, rules, this.inputFileName);
		}
		catch (e) {
			this.error("Ruleset \"" + this.RuleSetName + "\" failed.\n\t" + e);
		}
	}

	/*
	 * Run the list of rules that are all in the same rulesDirectory, starting with the given file.
	 * (The output from a rule will generally be a new file which is input to the next rule.)
	 */
	runRules(rulesDirectory, rules, file) {
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
		};
		this.ruleIterator = makeIterator(rules);

		this.runRule(rulesDirectory, this.ruleIterator.next(), currentResult);
	}

	runRule(rulesDirectory, ruleDescriptor, lastResult) {
		if (!ruleDescriptor || this.shouldAbort) {	// "shouldAbort" is set in the "log" method.
			// No more rules, so done.
			this.saveResults(lastResult);
			this.cleanup();
			console.log("Done.");
			return;
		}

		let ruleFilename = ruleDescriptor.FileName;
		if (!ruleFilename)
			throw("Rule has no 'FileName'.");

		// Find the rule file.
		ruleFilename = path.resolve(rulesDirectory, ruleFilename);
		let ruleClass;
		try {
			ruleClass = require(ruleFilename);
		}
		catch (e) {
			throw("Failed to load rule.\n\tCause: " + e);
		}

		// Get the rule's config.
		let config = ruleDescriptor.Config || {};
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
		config.Name = config.Name || path.basename(ruleFilename);
		this.RuleName = config.Name;

		const rule = new ruleClass.instance(config);

		// Try to match the input method to the data. i.e. a rule could support multiple import approaches
		// so we don't want to unnecessarily convert the data.
		try {
			if (rule.canUseMethod() && lastResult.data)			// No conversion necessary.
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
		rule.on(RuleAPI.NEXT, (data) => {
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
		rule.on(RuleAPI.NEXT, (filename) => {
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
		rule.on(RuleAPI.NEXT, (stream) => {
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

		this.saveLog(this.inputFileName);
	}

	cleanup() {
		// Remove the temp directory and contents.
		var deleteFolderRecursive = function(dir) {
			if( fs.existsSync(dir) ) {
				fs.readdirSync(dir).forEach(function(file, index){
					var curPath = dir + path.sep + file;
					if(fs.lstatSync(curPath).isDirectory()) {
						deleteFolderRecursive(curPath);
					} else { // delete file
						fs.unlinkSync(curPath);
					}
				});
				fs.rmdirSync(dir);
			}
		};

		deleteFolderRecursive(this.tempDir);
	}

	// Add some useful things to a config object.
	updateConfig(config) {
		config.RootDirectory = config.RootDirectory || this.rootDir;
		config.TempDirectory = config.TempDirectory || this.tempDir;
		config.OutputEncoding = config.Encoding || this.encoding;
		config.Encoding = this.encoding;
		config.validator = this;
	}

	// Create a unique temporary filename in the temp directory.
	getTempName(config) {
		const dirname = (config && config.TempDirectory) || this.tempDir;
		const filename = this.createGUID();
		return path.resolve(dirname, filename);
	}

	createGUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		})};

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
		if (this.dataAccessor)
			return this.dataAccessor.loadFile(filename, encoding || 'utf8');
		else
			throw(this.constructor.name + " does not load files.");
	}

	/**
	 * This method is used by the application to save the log of results for the given file synchronously.
	 * @param filename {string} the name of the file to save.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 * @private
	 */
	saveLog(filename) {
		if (this.dataAccessor && this.logger)
			this.dataAccessor.saveLog(this.logger.getLog(), filename);
		else
			throw(this.constructor.name + " does not save log files.");
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
		if (this.dataAccessor)
			this.dataAccessor.saveFile(fileContents, filename, encoding || 'utf8');
		else
			throw(this.constructor.name + " does not save files.");
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
		if (this.dataAccessor) {
			const fullname = this.getTempName();
			fs.writeFileSync(fullname, fileContents, encoding);
			return fullname;
		}
		else
			throw(this.constructor.name + " does not save files.");
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
		if (this.dataAccessor)
			this.dataAccessor.putFile(fileNameOrStream, remoteFileName);
		else
			throw(this.constructor.name + " does not put files.");
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
		if (this.dataAccessor)
			this.dataAccessor.getFile(remoteFileName, localFileName);
		else
			throw(this.constructor.name + " does not get files.");
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
		if (this.dataAccessor)
			return this.dataAccessor.getLog(logFileName);
		else
			throw(this.constructor.name + " does not get files.");
	}

	/**
	 * This is called when the application has something to log.
	 * @param {string} level the level of the log. One of {@link Validator.ERROR}, {@link Validator.WARNING}, or {@link Validator.INFO}.
	 * If null or undefined
	 * then {@link Validator.INFO} is assumed.
	 * @param problemFileName {string} the name of the file causing the log to be generated. (ex. the rule's filename)
	 * @param problemDescription {string} a description of the problem encountered.
	 * @param shouldAbort should the running of rules stop at the end of the current rule,
	 * @private
	 */
	log(level, problemFileName, problemDescription, shouldAbort) {
		this.shouldAbort = shouldAbort || false;
		if (this.logger)
			this.logger.log(level, problemFileName, problemDescription);
		else {
			level = level || RuleAPI.INFO;
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
		this.log(RuleAPI.ERROR, this.constructor.name, problemDescription);
	}

	/**
	 * Add a warning to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	warning(problemDescription) {
		this.log(RuleAPI.WARNING, this.constructor.name, problemDescription);
	}

	/**
	 * Add an information report to the log.
	 * @param problemDescription {string} a description of the problem encountered.
	 * @private
	 */
	info(problemDescription) {
		this.log(RuleAPI.INFO, this.constructor.name, problemDescription);
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
		.parse(process.argv);

	if (!program.config)
		program.help((text) => {
			return "A configuration file must be specified.\n" + text;
		});

	let config = require(path.resolve(__dirname, program.config));
	config.RuleSet = program.ruleset || config.RuleSet;
	if (!config.RuleSet)
		program.help((text) => {
			return "A ruleset must be specified either as an argument or a property in the config. file.\n" + text;
		});

	// If the input or output are not set they'll be grabbed from the ruleset file.
	let inputFile = program.input;
	let outputFile = program.output;
	let inputEncoding = program.encoding;

	config.scriptName = scriptName;
	const validator = new Validator(config);

	// TODO: Remove this log message once there are more reasonable log messages.
	if (validator.logger)
		validator.info("Using " + validator.logger.constructor.name + " for error and warning reports.");
	else {
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
		process.exit(1);
	}

	process.on('uncaughtException', (err) => {
		// Caught an uncaught exception so something went extraordinarily wrong.
		// Log the error and then give up. Do not attempt to write the output file because we have no idea
		// how many rules have been run on it or what state it is in.
		if (err) {
			if (typeof err == 'string')
				validator.error(err);	// Record the uncaught exception.
			else if (err.message)
				validator.error(err.message);
			else
				validator.error(JSON.stringify(err));	// No idea what this is but try to represent it as best we can.
		}
		else
			validator.error(`Unspecified error. Last rule attempted was ${validator.RuleName} in ruleset ${validator.RuleSetName}.`)

		validator.saveLog(validator.inputFileName);	// Write the log.
		process.exit(1);	// Quit.
	});
}

module.exports = Validator;
