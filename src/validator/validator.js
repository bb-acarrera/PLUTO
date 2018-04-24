/**
 * @private
 */
const fs = require('fs-extra');
const path = require("path");
const rimraf = require('rimraf');
const stream = require('stream');
const md5File = require('md5-file');


const ErrorHandlerAPI = require("../api/errorHandlerAPI");

const Util = require("../common/Util");

const ErrorLogger = require("./ErrorLogger");
const RuleSet = require("./RuleSet");

const RuleLoader = require('../common/ruleLoader');

const Reporter = require('./reporter');

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
			throw "Failed to find RootDirectory \"" + this.rootDir + "\".";

		if (this.config.rulesDirectory)
			this.config.rulesDirectory = path.resolve(this.rootDir, this.config.rulesDirectory);
		else
			this.config.rulesDirectory = path.resolve(this.rootDir, 'rules');	// By default rules live with the rulesets.

		if (!fs.existsSync(this.config.rulesDirectory))
			console.log("Failed to find custom RulesDirectory \"" + this.config.rulesDirectory + "\".");

		this.inputDirectory  = path.resolve(this.rootDir, this.config.inputDirectory || "");
		this.outputDirectory = path.resolve(this.rootDir, this.config.outputDirectory || "");

		if (!fs.existsSync(this.outputDirectory))
			fs.mkdirSync(this.outputDirectory);	// Make sure the outputDirectory exists.

		this.logger = new ErrorLogger(config);

		// Remember the name of the current ruleset and rule for error reporting.
		this.rulesetName = undefined;
		this.ruleName = undefined;

		this.runPollingInterval = this.config.runPollingInterval || 10;
		this.runPollingTimeout = this.config.runMaximumDuration || 600;

		this.updateConfig(this.config);

		if(!Data) {
			throw "No data accessor supplied";
		}

		// This needs to be done after the above tests and setting of the global config object.
        this.data = Data(this.config);

		this.ruleLoader = new RuleLoader(this.config.rulesDirectory, this.data);


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

		this.outputResults = {
			starttime: new Date(),
			user: this.config.user,
			group: this.config.group,
			ruleset: this.config.ruleset
		};

		this.data.createRunRecord(this.config.ruleset, this.config.user, this.config.group).then((runId) => {

			this.runId = runId;
			this.outputResults.runId = runId;

			console.log(JSON.stringify({state: "start", runId: runId, tempFolder: this.tempDir}));

			this.data.retrieveRuleset(this.config.ruleset, this.config.rulesetOverride,
				this.ruleLoader, undefined, undefined, undefined, true)
				.then((ruleset) => {

					if(!ruleset){
						throw new Error("No Ruleset found for: " + this.config.ruleset);
					}

					ruleset.resolve(this.ruleLoader, undefined, true).then(() => {
						this.processRuleset(ruleset, outputFile, inputEncoding, inputFile, inputDisplayName);
					});

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

		this.reporter = new Reporter(this.config, ruleset, this.logger, this.ruleLoader);

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


			this.checkFile(ruleset, this.inputFileName);
		} else {
			this.inputFileName = this.getTempName();

			this.importFile(ruleset.import, this.inputFileName).then( (displayInputFileName) => {

					this.displayInputFileName = displayInputFileName;

					this.checkFile(ruleset, this.inputFileName);


				},error => {
					this.error("Failed to import file: " + error);
					this.finishRun();
				})
				.catch(() => {
					this.finishRun();
				});
		}

    }

	checkFile(ruleset, file) {

		try {

			if (!fs.existsSync(file))
				throw "Input file \"" + file + "\" does not exist.";

		} catch(e) {
			this.error("Ruleset \"" + this.rulesetName + "\" failed. " + e);
			throw e;
		}

		md5File(file, (err, hash) => {

			try
			{
				if(err) {
					this.error("Ruleset \"" + this.rulesetName + "\" failed md5 check. " + err);
					throw err;
				}

				this.checkHash(ruleset, hash).then((proceed) => {

					if(proceed) {
						this.runRules(ruleset, file);
					} else {
						this.finishRun();
					}

				}, (err) => {
					this.error("Ruleset \"" + this.rulesetName + "\" failed to check hash. " + err);
					throw err;
				}).catch(() => {
					this.finishRun();
				});
			} catch(e) {
				this.finishRun();
			}

		});
	}

	// returns Promise, with value true if the check is OK, and false if the check matches and we should not proceed.
	checkHash(ruleset, hash) {

		return new Promise((resolve) => {

			if(this.config.testOnly) {
				resolve(true);
				return;
			} else if(!this.config.doMd5HashCheck) {
				//update the hash
				this.data.saveRunRecord(this.runId, null, null, null, null, null, null, null, hash, this.config.user, this.config.group)
					.then(()=>{},()=>{}).catch(()=>{}).then(() => {
						resolve(true);
					});

				return;
			}

			let targetId = this.currentRuleset.targetDetails ? this.currentRuleset.targetDetails.id : null;

			this.data.getRuns(1,1, {
				rulesetVersionIdFilter: ruleset.id,
				inputMd5Filter: hash,
				latestRulesetVersionWithMd5: true,
				latestRulesetVersionExcludeRunId: this.runId,
				targetId: targetId,
				showErrors: true,
				showWarnings: true,
				showNone: true,
				showDropped: true,
				showPassed: true,
				showFailed: true
			}).then((results) => {

				if(results.runs.length == 0) {
					//no match, so we can proceed
					//update the hash
					this.data.saveRunRecord(this.runId, null, null, null, null, null, null, null, hash, this.config.user, this.config.group)
						.then(()=>{},()=>{}).catch(()=>{}).then(() => {
							resolve(true);
						});

					return;
				}

				//found a match
				this.warning("The configuration and file are the same as the last validation. Nothing to validate or upload.");
				this.skipped = true;
				resolve(false);

			}, (err) => {
				//some unknown problem getting the list
				this.error("Ruleset \"" + this.rulesetName + "\" failed. " + err);
				throw err;
			});

		})

	}

	/*
	 * Run the list of rules that are all in the same rulesDirectory, starting with the given file.
	 * (The output from a rule will generally be a new file which is input to the next rule.)
	 */
	runRules(ruleset, file) {

		this.sharedData = ruleset.config && ruleset.config.sharedData ? ruleset.config.sharedData : {};
		this.abort = false;

		try {

			if ((!ruleset.rules || ruleset.rules.length == 0) && ruleset.dovalidate !== false) {
				this.warning("Ruleset \"" + this.rulesetName + "\" contains no rules.");
				this.finishRun();
				return;
			}

			let rules = [];
			let cleanupRules = [];
			this.posttasks = [];

			if(this.parserClass) {
				this.updateConfig(this.parserConfig);
			}

			let currentParserClass = null;

			if (ruleset.dovalidate !== false) {
                ruleset.rules.forEach( ( ruleConfig ) => {
                    let rule = this.getRule( ruleConfig );

	                // if this rule is changing the sturcture, or the parser is changing
	                if(rule.structureChange || currentParserClass != rule.ParserClassName) {

		                //add the cleanup rules (if any)
		                cleanupRules.forEach( ( cleanupRule ) => {
			                rules.push( cleanupRule );
		                } );
		                cleanupRules = [];

		                if(rule.structureChange) {
			                currentParserClass = null;
		                } else {

			                currentParserClass = rule.ParserClassName;

			                //for now, since we only support one parser, just make sure it's the same
							if(this.parserClass && this.parserClass.name == rule.ParserClassName) {

								if(this.parserClass.getParserSetupRule) {
									const setup = this.parserClass.getParserSetupRule(this.parserConfig);
									if(setup) {
										rules.push(setup);
									}

								}

								if(this.parserClass.getParserCleanupRule) {
									const cleanup = this.parserClass.getParserCleanupRule(this.parserConfig);
									if(cleanup) {
										cleanupRules.push(cleanup);
									}

								}
							} else {
								currentParserClass = null;
							}


		                }

	                }

                    if ( rule.getSetupRule ) {
                        const setup = rule.getSetupRule();
                        if ( setup ) {
                            rules.push( setup );
                        }

                    }

                    if ( rule.getCleanupRule ) {
                        const cleanup = rule.getCleanupRule();
                        if ( cleanup ) {
                            cleanupRules.push( cleanup );
                        }

                    }


                    rules.push( rule );

                } );


                if(this.config.requiredRules) {
                    this.config.requiredRules.forEach( ( reqParser ) => {

	                    let parserFilename = ruleset.parser ? ruleset.parser.filename : null;

                        if ( reqParser.parser != parserFilename ) return;

                        reqParser.rules.forEach((reqRule)=>{
                            let res = ruleset.rules.find(function(r){
                                let ret = (r.filename === reqRule.filename);
                                for (let key in reqRule.config) {
                                    if(key !== "id"){
                                        if (reqRule.config.hasOwnProperty(key)) {
                                            ret = ret && (reqRule.config[key] == r.config[key]);
                                        }
                                    }
                                }
                                return ret;
                            });
                            if (!res) {
                                let configResult = "";
                                for (let ruleKey in reqRule.config) {
                                    configResult += " " + ruleKey + " = " + reqRule.config[ruleKey] + ";";
                                }
                                this.error("Missing or misconfigured required rule " + reqRule.filename + " with the following configuration: " + configResult);
                            }
						});

                    } );
                }



                cleanupRules.forEach( ( cleanupRule ) => {
                    rules.push( cleanupRule );
                } );

                this.executedRules = rules;

				if(ruleset.posttasks && ruleset.posttasks.length > 0) {
					ruleset.posttasks.forEach((taskConfig) => {
						let task = this.getPosttask(taskConfig);

						if(!task) {
							this.error("Could not find post task " + taskConfig.filename);
							return;
						}

						this.posttasks.push(task);
					});
				}


            }

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
				if (lastResult.index < rules.length && !validator.abort && rules.length > 0)
					return rules[lastResult.index]._run(lastResult.result).thenReturn(lastResult.index + 1).then(loop);
				else
					return lastResult;
			}).catch((e) => {
				const errorMsg = `${this.rulesetName}: Rule: "${this.ruleName}" failed. ${e.message ? e.message : e}`;
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

			// if (!ruleset.rules || ruleset.rules.length == 0 )
			// 	this.finishRun(this.displayInputFileName);	// If there are rules this will have been run asynchronously after the last run was run.

		} catch(e) {
			this.error("Ruleset \"" + this.rulesetName + "\" failed. " + e);
			throw e;
		}
	}

	getRule(ruleDescriptor) {
		var ruleClass = this.loadRule(ruleDescriptor.filename);


		// Get the rule's config.
		let config = ruleDescriptor.config || {};

		// Set the validator so that the rule can report errors and such.
		// TODO: This would still have to be done when running the rules, not before.
		this.updateConfig(config);
		config.name = config.name || ruleDescriptor.filename;
		this.ruleName = config.name;
		config.errors = ruleDescriptor.errors;

		let properties = this.ruleLoader.rulePropertiesMap[ruleDescriptor.filename];
		if (properties && properties.attributes)
		    config.attributes = properties.attributes;
		
		let rule;

		if(ruleClass.NeedsParser) {

			if(!this.parserClass) {
				throw("Rule requires parser, but no parser in ruleset");
			}

			if(!this.parserClass.isTypeSupported(ruleClass.Parser)) {
				throw(`Rule/Parser mistmatch. Rule ${ruleDescriptor} needs ${ruleClass.Parser} parser but ${this.parserConfig.name} does not support it.`);
			}



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

	getPosttask(descriptor) {
		var posttaskClass = this.loadPosttask(descriptor);


		// Get the rule's config.
		let config = descriptor.config || {};

		// Set the validator so that the rule can report errors and such.
		this.updateConfig(config);
		config.name = config.name || descriptor.filename;
		this.ruleName = config.name;
		config.errors = descriptor.errors;

		let properties = this.ruleLoader.rulePropertiesMap[descriptor.filename];
		if (properties && properties.attributes)
			config.attributes = properties.attributes;

		return new posttaskClass(config);


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

		if(!results) {
			return this.finishRunImpl(results);
		}

		return new Promise((resolve) => {

			const done = () => {
				this.finishRunImpl(results).then(() => {
					return resolve();
				}, () => {
					return resolve();
				});
			};

			const waitForRunsCheck = () => {
				this.data.getRuns(1, 1, {
					isRunning: true,
					rulesetExactFilter: this.currentRuleset.ruleset_id,
					idLessThanFilter: this.runId,
					showErrors: true,
					showWarnings: true,
					showNone: true,
					showDropped: true,
					showPassed: true,
					showFailed: true
				}, "runId").then((result) => {
					if(result.rowCount > 0) {

						const currTime = new Date();
						const taskTime = result.runs[0].starttime;
						const diff = Math.abs((taskTime.getTime() - currTime.getTime())/1000);

						//give it another 30 seconds so the server has a chance to clean it up first
						if(diff > this.runPollingTimeout + 30) {
							this.cleanupOldRun(result.runs[0].id).then(() => {
								//give it a couple of seconds in case an upstream one is actually running
								setTimeout(waitForRunsCheck, this.runPollingInterval * 1000);
							});
						} else {
							setTimeout(waitForRunsCheck, this.runPollingInterval * 1000);
						}

					} else {
						done();
					}

				});
			};

			//check to see if there are any other instances of this rule running
			waitForRunsCheck();

		});

	}

	cleanupOldRun(runId) {
		return new Promise((resolve) => {

			const logger = new ErrorLogger();

			let msg = `Appears to have stopped without cleaning up and was not cleaned up by the server that
			 started it, likely due to a failure/crash of the server on that server. Another run (${this.runId})
			 waiting to process the same file has marked this as finished.`;

			logger.log(ErrorHandlerAPI.ERROR, this.constructor.name, undefined, msg);
			console.log(`Run ${runId} ${msg}`);

			this.data.saveRunRecord(runId, logger.getLog(),
				null, null, null, logger.getCounts(),
				false, null, null, true, this.config.user, this.config.group)
				.then(() => { //no-op
				}, (error) => console.log('error cleaning up bad run: ' + error))
				.catch((e) => console.log('Exception cleaning up bad run: ' + e))
				.then(() => {
					resolve();
				});


		});
	}


	finishRunImpl(results) {

		return new Promise((resolve) => {
			if (!this.running) {
				resolve();
				return;
			}

			this.running = false;
			if(!this.inputFileName){
				this.inputFileName = "";
			}

			this.summary = {
				exported: false
			};

			this.updateSummaryCounts();

			if(!this.finalChecks()) {
				results = null;
			}


			if(!results) {

				if(!this.abort && !this.skipped) {
					console.error("No results");
					this.error("No results were produced.");
				}

				this.finalize().then(() => resolve());
			} else if(this.outputFileName) {

				this.saveResults(results);
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
					.then(() =>
						{
							if(resultsFile) {
								this.summary.exported = true;
								if(this.currentRuleset.target) {

									if(this.currentRuleset.targetDetails) {
										this.summary.target = this.currentRuleset.targetDetails.description;
									} else {
										this.summary.target = this.currentRuleset.target.filename;
									}

									this.summary.targetid = this.currentRuleset.target.filename;
									this.summary.targetFile = this.currentRuleset.target.config.file;
								}
							}

						},
						(error) => {
							this.error("Export failed: " + error);
							this.abort = true;
						})
					.catch((e) => {
						this.error("Export" + importConfig.filename + " fail unexpectedly: " + e);
						this.abort = true;
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

	updateSummaryCounts() {

		if(!this.summary) {
			this.summary = {}
		}

		const summary = this.summary;

		summary.processeditems = 0;
		summary.outputitems = 0;
		summary.wasTest = this.config.testOnly;
		summary.wasSkipped = this.skipped;

		if(this.executedRules) {
			//find the initial # of processed items
			let i, rule;
			for(i = 0; i < this.executedRules.length; i++) {
				if(this.executedRules[i].summary) {
					rule = this.executedRules[i];
					break;
				}
			}

			if(rule) {
				summary.processeditems = rule.summary.processed;
			}

			//find the final # of output items
			for(i = this.executedRules.length - 1; i >= 0; i--) {
				if(this.executedRules[i].summary) {
					rule = this.executedRules[i];
					break;
				}
			}

			if(rule) {
				summary.outputitems = rule.summary.output;
			}
		}

		return summary;
	}

	finalize() {
		return new Promise((resolve) => {

			function postSave() {
				if (this.reporter && !this.config.testOnly && !this.skipped)
					this.reporter.sendReport(this.currentRuleset, this.runId, this.abort);
				this.cleanup();
				resolve();
			}

			function saveRunRecord() {

				let passed = null;
				if(!this.skipped) {
					passed = !this.abort;
				}

				this.outputResults.counts = this.logger.getCounts();
				this.outputResults.summary = this.summary;
				this.outputResults.inputFileName = this.displayInputFileName;
				this.outputResults.outputFileName = this.outputFileName;
				this.outputResults.passed = passed;
				this.outputResults.finishtime = new Date();


				this.data.saveRunRecord(this.runId, this.logger.getLog(),
					this.currentRuleset, this.displayInputFileName, this.outputFileName, this.logger.getCounts(),
					passed, this.summary, null, true, this.config.user, this.config.group)
					.then(() => { //no-op
					}, (error) => console.log('error saving run: ' + error))
					.catch((e) => console.log('Exception saving run: ' + e))
					.then(() => {
						postSave.call(this);
					});
			}

			this.runPosttasks().then(()=> {
				if(this.reporter && this.reporter.initialized) {
					this.reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
						saveRunRecord.call(this);
					});
				} else {
					saveRunRecord.call(this);
				}
			});

		});
	}

	runPosttasks() {
		return new Promise((resolve) => {
			if(!this.skipped && !this.abort && this.posttasks && this.posttasks.length > 0) {

				let tasks = [];

				this.posttasks.forEach((task) => {
					tasks.push(() => task._run());
				});

				Util.serial(tasks)
					.then(()=>{}, (err) => { this.error('Error running post tasks: ' + err); })
					.catch((err) => { this.error('Error running post tasks: ' + err); })
					.then(() => { resolve(); });
			} else {
				resolve();
			}
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

		//generate the done message
		this.logOutputResults();

	}

	logOutputResults() {

		if(!this.outputResults.counts) {
			this.outputResults.counts = []
		}

		if(!this.outputResults.summary) {
			this.outputResults.summary = {}
		}

		let log = {
			state: "finish",
			runId: this.outputResults.runId,
			startTime: this.outputResults.starttime,
			finishTime: this.outputResults.finishtime,
			passed: this.outputResults.passed,
			user: this.outputResults.user,
			group: this.outputResults.group,
			numErrors: this.outputResults.counts[ErrorHandlerAPI.ERROR] || 0,
			numWarnings: this.outputResults.counts[ErrorHandlerAPI.WARNING] || 0,
			numDropped: this.outputResults.counts[ErrorHandlerAPI.DROPPED] || 0,
			processedItems: this.outputResults.summary.processedItems || 0,
			uploadedItems: this.outputResults.summary.outputitems || 0,
			exported: this.outputResults.summary.exported || false,
			wasSameFile: this.outputResults.summary.wasSkipped || false,
			wasTest: this.outputResults.summary.wasTest || false,
			rulesetId: this.outputResults.ruleset
		};

		let protocol = this.config.configHostProtocol || 'http';
		log.runUrl = `${protocol}://${this.config.configHost}/run/${this.outputResults.runId}`;

		function addConfig(source, target) {
			if (source) {
				Object.keys(source).forEach(function (key) {
					if (!key.startsWith('__')) {
						target[key] = source[key];
					}
				});
			}
		}

		function addPropConfig(source, target, classname) {

			if(!source) return;

			let base = this.ruleLoader.classMap[classname];
			let configProps = base ? base.ConfigProperties : null;
			if (configProps) {
				configProps.forEach((prop) => {
					if (prop.name && !prop.private) {
						target[prop.name] = source[prop.name];
					}
				});

			} else {
				addConfig.call(source, target);
			}
		}

		if(this.currentRuleset) {
			log.rulesetVersion = this.currentRuleset.version;
			log.rulesetOwnerGroup = this.currentRuleset.ownergroup;
			log.rulsetLastChangedTime = this.currentRuleset.updatetime;
			log.rulesetLastChangedUser = this.currentRuleset.updateuser;

			//custom fields
			if(this.currentRuleset.custom && this.currentRuleset.custom.config) {
				log.rulesetCustomFields = {};
				Object.keys(this.currentRuleset.custom.config).forEach((key) => {
					if(!key.startsWith('__')) {
						log.rulesetCustomFields[key] = this.currentRuleset.custom.config[key];
					}
				});
			}

			// source & import
			if(this.currentRuleset.sourceDetails) {
				log.rulsetSourceName = this.currentRuleset.sourceDetails.description;
				log.rulsetSourceId = this.currentRuleset.sourceDetails.rule_id;
				log.rulsetSourceVersion = this.currentRuleset.sourceDetails.version;
			}

			if(this.currentRuleset.import) {
				log.rulesetImportConfig = {};
				log.rulesetImporter = this.currentRuleset.import.filename;

				if(this.currentRuleset.import.config) {
					addPropConfig.call(this, this.currentRuleset.import.config, log.rulesetImportConfig, log.rulesetImporter);
				}
			}

			// target & export
			if(this.currentRuleset.targetDetails) {
				log.rulsetTargetName = this.currentRuleset.targetDetails.description;
				log.rulsetTargetId = this.currentRuleset.targetDetails.rule_id;
				log.rulsetTargetVersion = this.currentRuleset.targetDetails.version;
			}

			if(this.currentRuleset.export) {
				log.rulesetExportConfig = {};
				log.rulesetExporter = this.currentRuleset.export.filename;

				if(this.currentRuleset.export.config) {
					addPropConfig.call(this, this.currentRuleset.export.config, log.rulesetExportConfig, log.rulesetExporter);
				}
			}
		}


		console.log(JSON.stringify(log));


	}

	// Add some useful things to a config object.
	updateConfig(config) {
	    // Put non-rule stuff in the internal "__state" object.
	    config.__state = {};
	    
	    config.__state.rootDirectory = config.rootDirectory || this.rootDir;
	    config.__state.tempDirectory = this.tempDir;
	    config.__state.encoding = config.encoding || this.encoding;
	    config.__state.validator = this;
	    config.__state.sharedData = this.sharedData;
//		config.currentRuleset = this.currentRuleset;
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
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\". " + e);	// Can't create the outputDirectory to write to.
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
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\". " + e);	// Can't create the outputDirectory to write to, so can't use this logger.
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

	loadPosttask(config) {
		if(config.filename) {
			if(this.ruleLoader.posttasksMap[config.filename]) {
				return this.ruleLoader.posttasksMap[config.filename];
			}
		}

		throw("Failed to load posttask " + config.filename + ". Cause: not found");

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
			throw("Failed to load plugin " + filename + ". Cause: " + e);
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

	finalChecks() {

		if(this.abort) {
			return true;
		}

		let errorConfig = null;
		if(this.currentRuleset && this.currentRuleset.general) {
			errorConfig = this.currentRuleset.general.config;
		}

		if(errorConfig) {

			if (this.summary.processeditems && errorConfig.droppedPctToAbort && errorConfig.droppedPctToAbort > 0) {
				let droppedPct = this.logger.getCount(ErrorHandlerAPI.DROPPED) * 100.0 / this.summary.processeditems;

				if(droppedPct >= errorConfig.droppedPctToAbort) {
					this.abortRun('Too many dropped items. ' +
						droppedPct + '% were dropped and limit was ' + errorConfig.droppedPctToAbort + '%');
					return false;
				}
			}
		}

		return true;
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

			if (errorConfig.droppedToAbort && errorConfig.droppedToAbort > 0 &&
				this.logger.getCount(ErrorHandlerAPI.DROPPED) >= errorConfig.droppedToAbort) {
				this.abortRun('Too many total dropped items. Got ' +
					this.logger.getCount(ErrorHandlerAPI.DROPPED) + ' limit was ' + errorConfig.droppedToAbort);
				return;
			}

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

				if (rule.config.droppedToAbort && rule.config.droppedToAbort > 0 &&
					this.logger.getCount(ErrorHandlerAPI.DROPPED, ruleID) >= rule.config.droppedToAbort) {
					this.abortRun('Too many dropped items for ' + rule.filename + '. Got ' +
						this.logger.getCount(ErrorHandlerAPI.DROPPED, ruleID) + ' limit was ' + rule.config.droppedToAbort);
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
