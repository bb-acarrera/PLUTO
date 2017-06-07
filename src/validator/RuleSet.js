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
			this._filename = ruleset.FileName;
			this.rulesDirectory = ruleset.data.attributes["rules-directory"];
			this.addRules(ruleset.data.attributes.rules);
		}
		else {
			this.name = ruleset.Name;
			this.id = ruleset.id || this.name;
			this._filename = ruleset.FileName;
			this.rulesDirectory = ruleset.RulesDirectory;
			this.addRules(ruleset.Rules);
		}
	}

	addRules(rules) {
		this.rules = [];
		for (var i = 0; i < rules.length; i++) {
			const srcRule = rules[i];
			const dstRule = {};
			dstRule.config = srcRule.Config || srcRule.config;
			dstRule.filename = srcRule.FileName || srcRule.filename;
			this.rules.push(dstRule);
		}
	}
}

module.exports = RuleSet;
