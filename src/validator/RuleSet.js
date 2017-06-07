class RuleSet {
	get filename() {
		// Use the existing filename if there is one otherwise convert the name to a camelcase filename.
		return this._filename || this.name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
			return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
		}).replace(/\s+/g, '');
	}

	constructor(ruleset) {
		this.name = ruleset.Name;
		this.id = ruleset.id || this.name;
		this._filename = ruleset.FileName;
		this.rules = ruleset.Rules;
		this.rulesDirectory = ruleset.RulesDirectory;
	}
}

module.exports = RuleSet;
