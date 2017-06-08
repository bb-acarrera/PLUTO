const BaseRouter = require('./baseRouter');
const RuleSet = require('../../validator/RuleSet');
const Util = require('../../utilities/Util');

class RulesetRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res, next) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.
		const ruleset = Util.retrieveRuleset(this.config.validator.config.RulesetDirectory, req.params.id);
		if (!ruleset)
			return next(new Error("Unable to find ruleset."));

		var rules = [];
		for (var i = 0; i < ruleset.rules.length; i++) {
			const rule = ruleset.rules[i];
			const ruleFilename = rule.filename;
			const rulename = Util.getRuleName(rule);
			rules.push(
				{
					filename: ruleFilename,
					name: rulename,
					config: rule.config
				});
		}

		res.json({
			data: {
				type: "ruleset",
				id: req.params.id,	// The filename is used for the id.
				attributes: {
					name: ruleset.name,		// The ruleset's name is used here. This will be displayed in the UI.
					rules : rules
				}
			}
		});
	}

	patch(req, res, next) {
		const ruleset = new RuleSet(req.body);
		this.config.validator.saveRuleSet(ruleset);
		res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
	}
}

module.exports = RulesetRouter;
