const path = require("path");
const RuleSet = require("../validator/RuleSet");
const fs = require('fs-extra');
class Util {
	/*
	 * Retrieve a ruleset description.
	 * @param rootDir the directory that may contain the ruleset file.
	 * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
	 * @return an object describing a ruleset.
	 */
	static retrieveRuleset(rootDir, ruleset) {
		if (typeof ruleset === 'string') {
			// Identifying a file to load.
			const rulesetFile = path.resolve(rootDir, ruleset);
			var contents;
			try {
				contents = require(rulesetFile);
			}
			catch (e) {
				throw("Failed to load ruleset file \"" + rulesetFile + "\".\n\t" + e);
			}

			if (!contents.RuleSet) {
				throw("Ruleset file \"" + rulesetFile + "\" does not contain a RuleSet member.");
			}

			contents.RuleSet.filename = ruleset;
			contents.RuleSet.name = contents.RuleSet.name || contents.RuleSet.filename;
			ruleset = contents.RuleSet;
		}

		return new RuleSet(ruleset);
	}

	/*
	 * Get the name of a rule given a rule description
	 * @param ruleDescriptor the object describing the rule.
	 */
	static getRuleName(ruleDescriptor) {
		return ruleDescriptor.name || ruleDescriptor.Name || path.basename(ruleDescriptor.filename);
	}

	static getRulesets(rootDir) {
		var rulesets = [];

		fs.readdirSync(rootDir).forEach(file => {
			if(file.substr(file.length-5) === '.json') {
				rulesets.push(file);
			}
		});

		return rulesets;
	}
}

module.exports = Util;
