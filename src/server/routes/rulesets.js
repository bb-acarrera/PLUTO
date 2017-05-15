const BaseRouter = require('./baseRouter');
const Util = require('../../utilities/Util');

class RulesetRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	route(req, res, next) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.
		const ruleset = Util.retrieveRuleset(this.config.validator.config.RulesetDirectory, req.params.id);
		if (!ruleset)
			return next(new Error("Unable to find ruleset."));

		var relationshipRules = [];
		var includedRules = [];
		for (var i = 0; i < ruleset.Rules.length; i++) {
			const rule = ruleset.Rules[i];
			const ruleFilename = rule.FileName;
			const rulename = Util.getRuleName(rule);
			relationshipRules.push({type: 'rule', id: ruleFilename});
			includedRules.push(
				{
					type: 'rule', id: ruleFilename,
					attributes: {
						filename: ruleFilename,
						name: rulename
					}
				});
		}

		res.json({
			data: {
				type: "ruleset",
				id: req.params.id,	// The filename is used for the id.
				attributes: {
					name: ruleset.Name		// The ruleset's name is used here. This will be displayed in the UI.
				},
				relationships: {
					rules: {
						data: relationshipRules
					}
				}
			},
			included: includedRules
		});
	}
}

module.exports = RulesetRouter;
