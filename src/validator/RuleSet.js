const Util = require("../common/Util");
const path = require("path");


class RuleSet {

	constructor(ruleset, rulesLoader) {
		this.name = ruleset.name;
		this.filename = ruleset.filename;

		// The ruleset_id is an unversioned ID that groups similar rulesets together.
		this.ruleset_id = ruleset.ruleset_id;

		// The id is the database row number and is therefore a versioned ID that uniquely identifies and differentiates
		// all rulesets.
		this.id = ruleset.database_id != undefined ? ruleset.database_id : ruleset.id || this._filename || this.name;	// Yes, the database_id should take precedence over "id". "id" is set by Ember.

		this.version = ruleset.version;

		this.import = ruleset.import;
		this.export = ruleset.export;
		this.parser = ruleset.parser;
		this.general = ruleset.general;
		this.source = ruleset.source;
		this.target = ruleset.target;

		if(ruleset.dovalidate === false) {
			this.dovalidate = false;
        } else {
			this.dovalidate = true;
		}
    
		this.custom = ruleset.custom;
		this.periodicity = ruleset.periodicity;


		this.config = ruleset.config;

		this.ownergroup = ruleset.owner_group;
		this.updateuser = ruleset.update_user;
		this.updatetime = ruleset.update_time;
		this.lastuploadtime = ruleset.last_upload_time;
		this.lastsuccesstime = ruleset.last_success_time;

		if(ruleset.canedit != null) {
			this.canedit = ruleset.canedit;
		} else {
			this.canedit = true;
		}

		if(ruleset.deleted) {
			this.deleted = true;
		}


		addGeneralConfig.call(this);

		addRules.call(this, ruleset.rules);

		addReporters.call(this, ruleset.reporters);
		
		this.addParserDefaults(rulesLoader);

		if(!this.canedit && rulesLoader) {
			privatize.call(this, rulesLoader);
		}

		let targetPath;
		if(this.target) {
			if(this.target.config && this.target.config.file) {
				targetPath = this.target.config.file
			}
		} else if(this.source) { //let's make an assumption here that if there is no target, but there is a source, it's linked
			if(this.source.config && this.source.config.file) {
				targetPath = this.source.config.file
			}
		}

		if(targetPath) {
			try {
				this.target_file = path.basename(targetPath, path.extname(targetPath));
			} catch(e) {}

		}
	}

	addParserDefaults(rulesLoader) {
        if (rulesLoader && this.parser && this.parser.filename) {
            var parserClass = rulesLoader.parsersMap[this.parser.filename];
            if (parserClass && parserClass.ConfigDefaults) {
                var defaults = parserClass.ConfigDefaults;
                for (var key in defaults) {
                    if (defaults.hasOwnProperty(key) && !this.parser.config.hasOwnProperty(key)) {
                        this.parser.config[key] = defaults[key];
                    }
                }
            }
        }
	}
	
	applyOverride(rulesetOverrideFile) {
		if (rulesetOverrideFile && typeof rulesetOverrideFile === 'string') {
			var contents;
			try {
				contents = require(rulesetOverrideFile);
			}
			catch (e) {
				throw("Failed to load ruleset override file \"" + rulesetOverrideFile + "\". " + e);
			}

			if (contents.import) {
				if (!this.import) {
					this.import = {};
				}

				if(!this.import.config) {
					this.import.config = {}
				}

				Object.assign(this.import.config, contents.import);
			}

			if(contents.export) {
				if(!this.export) {
					this.export = {};
				}

				if(!this.export.config) {
					this.export.config = {}
				}

				Object.assign(this.export.config, contents.export);
			}
		}
	}

	resolve(rulesLoader, group, admin) {



		return new Promise((resolve) => {

			let promises = [];

			if(this.source) {
				promises.push(() => { return this.updateSource(rulesLoader, group, admin)});
			}

			if(this.target) {
				promises.push(() => { return this.updateTarget(rulesLoader, group, admin)});
			}

			serial(promises).then(() => {
				resolve();
			}).catch(() => {
				resolve();
			});

		});


	}

	updateSource(rulesLoader, group, admin) {
		return new Promise((resolve) => {
			rulesLoader.getDbRule(this.source.filename, group, admin).then((sourceConfig) => {
				if (sourceConfig && sourceConfig.type === 'source') {
					this.import = {
						filename: sourceConfig.base,
						config: {}
					};

					updateConfig(sourceConfig.config, this.source.config, this.import.config);
					this.sourceDetails = Object.assign({}, sourceConfig);
					delete this.sourceDetails.config;
				}

				if(sourceConfig.config.linkedtargetid) { //overrides the existing target if there is one
					//apply the source config to the target config; there is an assumption that the source and
					// target have the same top-level configuration if they are linked
					this.target = {
						filename: sourceConfig.config.linkedtargetid,
						config: {}
					};

					updateConfig(this.source.config, {}, this.target.config);

					this.updateTarget(rulesLoader).then(() => {
						resolve();
					});

				} else {
					resolve();
				}


			});
		});
	}

	updateTarget(rulesLoader, group, admin) {
		return new Promise((resolve) => {

			if(this.targetResolved) {
				resolve();
				return;
			}

			rulesLoader.getDbRule(this.target.filename, group, admin).then((targetConfig) => {
				if (targetConfig && targetConfig.type === 'target') {
					this.export = {
						filename: targetConfig.base,
						config: {}
					};

					updateConfig(targetConfig.config, this.target.config, this.export.config);

					this.targetDetails = Object.assign({}, targetConfig);
					delete this.targetDetails.config;
				}

				this.targetResolved = true;
				resolve();
			});
		});
	}

	getRuleById(ruleId) {
		return this.ruleMap[ruleId];
	}

	injectFields(validatorConfig) {

		if(validatorConfig.requiredRules) {
            this.rules = this.rules || [];
            validatorConfig.requiredRules.forEach((srcParser)=>{
				if ( srcParser.parser != (this.parser ? this.parser.filename : null) ) return;

                srcParser.rules.forEach((srcRule)=>{
                	let rule = {
                		filename: srcRule.filename,
						injected: true
                	};
                	rule.config = srcRule.config || {};


                	rule.config.id = Util.createGUID();
                	this.rules.push(rule);});
			});

        }
	}

	addMissingData(validatorConfig) {

		if(validatorConfig) {
			addMissingReporters.call(this, validatorConfig.reporters);
		}
		if (!this.custom) {
			this.custom = {};
		}

		if (!this.custom.config) {
			this.custom.config = {};
		}

        if (!this.periodicity) {
            this.periodicity = {};
        }

        if (!this.periodicity.config) {
            this.periodicity.config = {};
        }
	}

	// toJSON() {
	// 	const ruleset = {};
	// 	ruleset.name = this.name;
	// 	ruleset.id = this.id;
	// 	ruleset.filename = this.filename;
	// 	ruleset.rules = this.rules;
    //
	// 	const response = {};
	// 	response.ruleset = ruleset;
    //
	// 	return response;
	// }

	/**
	 * The list of config properties.  Used by the UI for display.
	 * @returns {Array}
	 * @constructor
	 */
	static get ConfigProperties() {
		return  [
			/*{
				name: 'errorsToAbort',
				label: 'How many total errors before abort?',
				type: 'integer',
				tooltip: 'Stop execution when these many errors occur.'
			},*/ //hide from UI
			{
				name: 'droppedPctToAbort',
				label: 'How many dropped items as a percentage of the total before aborting?',
				type: 'number',
				tooltip: 'Stop execution when this percent of items are dropped.',
				validations: [
					{
						number : {
							gte: 1,
							allowBlank: true
						}
					}
				]
			},
			{
				name: 'droppedToAbort',
				label: 'How many total dropped items before aborting?',
				type: 'integer',
				tooltip: 'Stop execution when these many dropped items occur.',
				validations: [
					{
						number : {
							gte: 1,
							allowBlank: true
						}
					}
				]
			},
			{
				name: 'warningsToAbort',
				label: 'How many total warnings before aborting?',
				type: 'integer',
				tooltip: 'Stop execution when this many warnings occur.',
				validations: [
					{
						number : {
							gte: 1,
							allowBlank: true
						}
					}
				]
			}
		];
	}

	/**
	 * The default values for configuration.
	 * @returns {{}}
	 * @constructor
	 */
	static get ConfigDefaults() {
		return {
			errorsToAbort: 1
		};
	}
}

function addRules(rules) {
	this.rules = [];
	this.ruleMap = {};
	if (!rules)
		return;

	for (var i = 0; i < rules.length; i++) {
		const srcRule = rules[i];
		const dstRule = {};
		dstRule.config = srcRule.config;
		dstRule.filename = srcRule.filename;
		dstRule.name = srcRule.name || srcRule.filename;
		dstRule.ui = srcRule.ui;
		dstRule.injected = srcRule.injected;

		if(!dstRule.config.id) {
			dstRule.config.id = Util.createGUID();
		}


		if(dstRule.config.onError == null) {
			dstRule.config.onError = this.general.config.onError;
		}

		dstRule.config.errorsToAbort = cleanNumber(dstRule.config.errorsToAbort, this.general.config.singleRuleErrorsToAbort);
		dstRule.config.warningsToAbort = cleanNumber(dstRule.config.warningsToAbort, this.general.config.singleRuleWarningsToAbort);
		dstRule.config.droppedToAbort = cleanNumber(dstRule.config.droppedToAbort, this.general.config.singleRuleDroppedToAbort);

		this.rules.push(dstRule);
		this.ruleMap[dstRule.config.id] = dstRule;
	}
}

function addReporters(reporters) {
	this.reporters = [];

	if(reporters) {
		for (var i = 0; i < reporters.length; i++) {
			const srcReporter = reporters[i];
			const dstReporter = {};
			dstReporter.config = srcReporter.config;
			dstReporter.filename = srcReporter.filename;
			dstReporter.title = srcReporter.title;
			dstReporter.sendOn = srcReporter.sendOn;
			dstReporter.configId = srcReporter.configId;

			this.reporters.push(dstReporter);
		}
	}

}

function  addMissingReporters(validatorConfigReporters) {
	//for reporters, all specified reporters in the validator config should appear in the ruleset ui

	if(validatorConfigReporters) {

		validatorConfigReporters.forEach((reporter) => {

			let reporterConfig = this.reporters.find((rulesetReporter) => {
					return rulesetReporter.configId === reporter.id;
				});

			if(!reporterConfig) {
				reporterConfig = this.reporters.find((rulesetReporter) => {
					return rulesetReporter.filename === reporter.filename && (rulesetReporter.configId == null || reporter.id == null);
				});
			}


			if(!reporterConfig) {
				this.reporters.push({
					filename: reporter.filename,
					title: reporter.title,
					sendOn: reporter.sendOn,
					configId: reporter.id,
					config: {}
				})
			} else {
				reporterConfig.title = reporter.title;
				reporterConfig.sendOn = reporter.sendOn;
				reporterConfig.configId = reporter.id;
			}
		});
	}
}

function addGeneralConfig() {
	if(!this.general) {
		this.general = {};
	}

	if(!this.general.config) {
		this.general.config = {};
	}

	let config = this.general.config;

	if(!config.onError) {
		config.onError = 'abort';
	}

	config.errorsToAbort = cleanNumber(config.errorsToAbort, 1);
	config.warningsToAbort = cleanNumber(config.warningsToAbort);
	config.droppedToAbort = cleanNumber(config.droppedToAbort);
	config.droppedPctToAbort = cleanNumber(config.droppedPctToAbort, parseFloat);
	config.singleRuleErrorsToAbort = cleanNumber(config.singleRuleErrorsToAbort);
	config.singleRuleDroppedToAbort = cleanNumber(config.singleRuleDroppedToAbort);
	config.singleRuleWarningsToAbort = cleanNumber(config.singleRuleWarningsToAbort);


}

function privatize(rulesLoader) {
	const items = [
		'import',
		'export',
		'parser'
	];

	const configuredRules = ['source', 'target'];

	items.forEach((item) => {
		privatizeItem.call(this, this[item], rulesLoader, 'filename');
	});

	configuredRules.forEach((item) => {
		privatizeItem.call(this, this[item], rulesLoader, 'base');
	});

	this.rules.forEach((item) => {
		privatizeItem.call(this, item, rulesLoader, 'filename');
	});
}

function privatizeItem(item, rulesLoader, basePropName) {
	if(item && rulesLoader && item.config) {
		let baseRule = rulesLoader.rulePropertiesMap[item[basePropName]];

		if(baseRule && baseRule.attributes && baseRule.attributes.ui && baseRule.attributes.ui.properties) {
			baseRule.attributes.ui.properties.forEach((prop) => {

				if(prop.private)
				{
					if(prop.type === 'string') {
						item.config[prop.name] = '********';
					} else {
						delete item.config[prop.name];
					}
				}

			});
		}
	}
}

function cleanNumber(value, defaultVal, fn) {

	let retVal = value;

	if(!fn) {
		fn = parseInt;
	}

	if(typeof retVal === "string") {
		retVal = fn(retVal);
	}

	if(retVal == null || isNaN(retVal)) {
		retVal = defaultVal;
	}

	return retVal;
}

function updateConfig(dbItem, locItem, targetItem) {
	for(const key in dbItem) {
		if(dbItem.hasOwnProperty(key)) {
			targetItem[key] = dbItem[key];
		}
	}

	for(const key in locItem) {
		if(locItem.hasOwnProperty(key)) {
			targetItem[key] = locItem[key];
		}
	}
}

/*
 * serial executes Promises sequentially.
 * @param {funcs} An array of funcs that return promises.
 * @example
 * const urls = ['/url1', '/url2', '/url3']
 * serial(urls.map(url => () => $.ajax(url)))
 *     .then(console.log.bind(console))
 *
 * from: https://stackoverflow.com/a/41115086/432170
 */
const serial = funcs =>
	funcs.reduce((promise, func) =>
		promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]));

module.exports = RuleSet;
