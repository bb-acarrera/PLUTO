const Util = require("../common/Util");

class RuleSet {

	constructor(ruleset) {
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

		this.import = ruleset.import;
		this.export = ruleset.export;
		this.parser = ruleset.parser;
		this.general = ruleset.general;

		this.config = ruleset.config;

		addGeneralConfig.call(this);

		addRules.call(this, ruleset.rules);
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
			{
				name: 'errorsToAbort',
				label: 'How many total errors before abort?',
				type: 'integer',
				tooltip: 'Stop execution when these many errors occur.'
			},
			{
				name: 'warningsToAbort',
				label: 'How many total warnings before abort?',
				type: 'integer',
				tooltip: 'Stop execution when these many warnings occur.'
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
	config.singleRuleErrorsToAbort = cleanNumber(config.singleRuleErrorsToAbort);
	config.singleRuleWarningsToAbort = cleanNumber(config.singleRuleWarningsToAbort);


}

function cleanNumber(value, defaultVal) {

	let retVal = value;

	if(typeof retVal === "string") {
		retVal = parseInt(retVal);
	}

	if(retVal == null || isNaN(retVal)) {
		retVal = defaultVal;
	}

	return retVal;
}

module.exports = RuleSet;
