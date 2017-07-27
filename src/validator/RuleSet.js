class RuleSet {
	get filename() {
		// Use the existing filename if there is one otherwise convert the name to a camelcase filename.
		return this._filename || this.name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
			return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
		}).replace(/\s+/g, '');
	}

	constructor(ruleset) {
		if (ruleset.data) {
			this.name = ruleset.data.attributes.name;
			this._filename = ruleset.filename;
			this.id = ruleset.data.id || this._filename || this.name;
			this.addRules(ruleset.data.attributes.rules);
			this.import = ruleset.data.import;
			this.export = ruleset.data.export
		}
		else {
			this.name = ruleset.name;
			this._filename = ruleset.filename;
			this.id = ruleset.id || this._filename || this.name;
			this.addRules(ruleset.rules || ruleset.rules);
			this.import = ruleset.import;
			this.export = ruleset.export;

			this.config = ruleset.config;
		}
	}

	addRules(rules) {
		this.rules = [];
		if (!rules)
			return;

		for (var i = 0; i < rules.length; i++) {
			const srcRule = rules[i];
			const dstRule = {};
			dstRule.config = srcRule.config || srcRule.config;
			dstRule.filename = srcRule.filename || srcRule.filename;
			dstRule.id = srcRule.id;
			this.rules.push(dstRule);
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

				Object.assign(this.import.config, contents.import);
			}

			if(contents.export) {
				if(!this.export) {
					this.export = {};
				}

				Object.assign(this.export.config, contents.export);
			}
		}
	}

	toJSON() {
		const ruleset = {};
		ruleset.name = this.name;
		ruleset.id = this.id;
		ruleset.filename = this.filename;
		ruleset.rules = this.rules;

		const response = {};
		response.ruleset = ruleset;

		return response;
	}
}

module.exports = RuleSet;
