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
			this.id = ruleset.data.id || this.name;
			this._filename = ruleset.fileName;
			this.addRules(ruleset.data.attributes.rules);
			this.import = ruleset.data.import;
			this.export = ruleset.data.export
		}
		else {
			this.name = ruleset.name;
			this.id = ruleset.id || this.name;
			this._filename = ruleset.fileName;
			this.addRules(ruleset.rules || ruleset.Rules);
			this.import = ruleset.import;
			this.export = ruleset.export;
		}
	}

	addRules(rules) {
		this.rules = [];
		for (var i = 0; i < rules.length; i++) {
			const srcRule = rules[i];
			const dstRule = {};
			dstRule.config = srcRule.Config || srcRule.config;
			dstRule.fileName = srcRule.FileName || srcRule.fileName;
			dstRule.id = srcRule.id;
			this.rules.push(dstRule);
		}
	}

	toJSON() {
		const ruleset = {};
		ruleset.name = this.name;
		ruleset.id = this.id;
		ruleset.filename = this.filename;
		ruleset.rules = this.rules;

		const response = {};
		response.RuleSet = ruleset;

		return response;
	}
}

module.exports = RuleSet;
