const Util = require("../common/Util");

class RuleSet {
	// PJT: 17/08/01 Note that since the rulesets are now maintained in the database and they can be copied and edited
	// without being written to disk the use of a filename is far less important to the overall functioning of PLUTO.

	get filename() {
		// Use the existing filename if there is one otherwise convert the name to a camelcase filename.
		return this._filename || this.name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
			return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
		}).replace(/\s+/g, '');
	}

	constructor(ruleset) {
		this.name = ruleset.name;
		this._filename = ruleset.filename;

		// The ruleset_id is an unversioned ID that groups similar rulesets together.
		this.ruleset_id = ruleset.ruleset_id;

		// The id is the database row number and is therefore a versioned ID that uniquely identifies and differentiates
		// all rulesets.
		this.id = ruleset.database_id != undefined ? ruleset.database_id : ruleset.id || this._filename || this.name;	// Yes, the database_id should take precedence over "id". "id" is set by Ember.

		this.import = ruleset.import;
		this.export = ruleset.export;
		this.parser = ruleset.parser;
		this.errors = ruleset.errors;

		this.config = ruleset.config;

		if(!this.errors) {
			this.errors = {};
		}

		if(!this.errors.onError) {
			this.errors.onError = 'abort';
		}

		if(this.errors.errorsToAbort == null) {
			this.errors.errorsToAbort = 1;
		}

		this.addRules(ruleset.rules);
	}

	addRules(rules) {
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
				dstRule.config.onError = this.errors.onError;
			}

			if(dstRule.config.errorsToAbort == null) {
				dstRule.config.errorsToAbort = this.errors.singleRuleErrorsToAbort;
			}

			if(dstRule.config.warningsToAbort == null) {
				dstRule.config.warningsToAbort = this.errors.singleRuleWarningsToAbort;
			}

			this.rules.push(dstRule);
			this.ruleMap[dstRule.config.id] = dstRule;
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
}

module.exports = RuleSet;
