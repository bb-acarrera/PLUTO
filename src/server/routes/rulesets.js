const BaseRouter = require('./baseRouter');
const RuleSet = require('../../validator/RuleSet');
const Util = require('../../common/Util');


class RulesetRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.

		if(req.params.id) {
			const ruleset = this.config.data.retrieveRuleset(req.params.id);
			if (!ruleset)
				throw new Error("Unable to find ruleset.");

			var rules = [];
			for (var i = 0; i < ruleset.rules.length; i++) {
				const rule = ruleset.rules[i];
				const ruleFilename = rule.filename;
				if (rule.hasOwnProperty('config') && !rule.config.hasOwnProperty('Name'))
					rule.config.Name = ruleFilename;	// Make sure the rule has a name.
				rules.push(
					{
						filename: ruleFilename,
						config: rule.config
					});
			}

			res.json({
				data: {
					type: "ruleset",
					id: req.params.id,	// The filename is used for the id.
					attributes: {
						name: ruleset.name,		// The ruleset's name is used here. This will be displayed in the UI.
						rules: rules
					}
				}
			});
		} else {
			const rawRulesets = Util.getRulesets(this.config.validator.config.rulesetDirectory);

			const rulesets = [];

			rawRulesets.forEach(rulesetFileName => {
				rulesets.push({
					type: "ruleset",
					id: rulesetFileName
				})
			});

			res.json(rulesets);
		}
	}

	patch(req, res) {
		const ruleset = new RuleSet(req.body);
		this.config.data.saveRuleSet(ruleset);
		res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
	}

	getAll(req, res) {

	}
}

module.exports = RulesetRouter;
