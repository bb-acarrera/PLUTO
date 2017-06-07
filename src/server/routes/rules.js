/*
 * Obsolete. This code is now handled by the rulesets router directly. I'm keeping this code around
 * for a bit in case I ever need a rules router for another purpose.
 */
const BaseRouter = require('./baseRouter');
const Util = require('../../utilities/Util');

class RulesRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res, next) {
		const id = req.params.id;
		if (!id)
			return next(new Error("No rule ID specified."));

		const dash = id.lastIndexOf('-');
		if (dash < 0)
			return next(new Error(`Improperly formatted rule ID. '-' is missing in ${id}.`));

		const rulesetName = id.substring(0, dash);

		if (!rulesetName || rulesetName.length < 1)
			return next(new Error(`Incomplete rule ID. Ruleset name is missing in ${id}.`));

		const ruleset = Util.retrieveRuleset(this.config.validator.config.RulesetDirectory, rulesetName);
		const index = Number.parseInt(id.substring(dash+1));
		if (!index || rulesetName.length < 1)
			return next(new Error(`Improperly formatted rule ID. Index portion is not a number in ${id}.`));
		else if (index >= ruleset.Rules.length)
			return next(new Error(`Improperly formatted rule ID. Index is out of range in ${id}.`));

		const ruleName = ruleset.Rules[index].FileName;

		res.json({
			data : {
				type : "rule",
				id : req.params.id,
				attributes : {
					filename : ruleName
				}
			}
		});
	}
}

module.exports = RulesRouter;
