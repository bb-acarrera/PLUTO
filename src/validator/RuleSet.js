const Util = require("../common/Util");



class RuleSet {

	constructor(ruleset, ruleLoader) {
		this.name = ruleset.name;
		this.filename = ruleset.filename;

		if(!this.filename && this.name) {
			this.filename = this.name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
				return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
			}).replace(/\s+/g, '');
		}

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

		this.config = ruleset.config;

		this.group = ruleset.group;
		this.email = ruleset.email;

		this.ownergroup = ruleset.owner_group;
		this.updateuser = ruleset.update_user;
		this.updatetime = ruleset.update_time;

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
		
		this.addParserDefaults(ruleLoader);
	}

	addParserDefaults(ruleLoader) {
        if (ruleLoader && this.parser && this.parser.filename) {
            var parserClass = ruleLoader.parsersMap[this.parser.filename];
            if (parserClass && parserClass.ConfigDefaults) {
                var defaults = parserClass.ConfigDefaults;
                for (var key in defaults) {
                    if (defaults.hasOwnProperty(key) && !this.parser.hasOwnProperty(key)) {
                        this.parser[key] = defaults[key];
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
				throw("Failed to load ruleset override file \"" + rulesetOverrideFile + "\".\n\t" + e);
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

	resolve(ruleLoader) {



		return new Promise((resolve) => {

			let promises = [];

			if(this.source) {
				promises.push(this.updateSource(ruleLoader));
			}

			if(this.target) {
				promises.push(this.updateTarget(ruleLoader));
			}


			Promise.all(promises).then(() => {
				resolve();
			}).catch(() => {
				resolve();
			});
		});


	}

	updateSource(ruleLoader) {
		return new Promise((resolve) => {
			ruleLoader.getDbRule(this.source.filename).then((sourceConfig) => {
				if (sourceConfig && sourceConfig.type === 'source') {
					this.import = {
						filename: sourceConfig.base,
						config: {}
					};

					updateConfig(sourceConfig.config, this.source.config, this.import.config);
				}

				if(sourceConfig.config.linkedtargetid && !this.target) {
					//apply the source config to the target config; there is an assumption that the source and
					// target have the same top-level configuration if they are linked
					this.target = {
						filename: sourceConfig.config.linkedtargetid,
						config: {}
					};

					updateConfig(this.source.config, {}, this.target.config);

					this.updateTarget(ruleLoader).then(() => {
						resolve();
					});

				} else {
					resolve();
				}


			});
		});
	}

	updateTarget(ruleLoader) {
		return new Promise((resolve) => {
			ruleLoader.getDbRule(this.target.filename).then((targetConfig) => {
				if (targetConfig && targetConfig.type === 'target') {
					this.export = {
						filename: targetConfig.base,
						config: {}
					};

					updateConfig(targetConfig.config, this.target.config, this.export.config);
				}

				resolve();
			});
		});
	}

	getRuleById(ruleId) {
		return this.ruleMap[ruleId];
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
				tooltip: 'Stop execution when this percent of items are dropped.'
			},
			{
				name: 'droppedToAbort',
				label: 'How many total dropped items before aborting?',
				type: 'integer',
				tooltip: 'Stop execution when these many dropped items occur.'
			},
			{
				name: 'warningsToAbort',
				label: 'How many total warnings before aborting?',
				type: 'integer',
				tooltip: 'Stop execution when this many warnings occur.'
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
	for(const key in locItem) {
		if(locItem.hasOwnProperty(key)) {
			targetItem[key] = locItem[key];
		}
	}

	for(const key in dbItem) {
		if(dbItem.hasOwnProperty(key)) {
			targetItem[key] = dbItem[key];
		}
	}
}

module.exports = RuleSet;
