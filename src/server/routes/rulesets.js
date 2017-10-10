const BaseRouter = require('./baseRouter');
const RuleSet = require('../../validator/RuleSet');
const Util = require('../../common/Util');


class RulesetRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res, next) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.

		if(req.params.id || req.query.id) {

			let id = '';
			let version = null;

			if(req.params.id) {
				id = req.params.id;
			} else if(req.query.id) {
				id = req.query.id;
			}

			if(req.query.version) {
				version = req.query.version;
			}

			this.config.data.retrieveRuleset(id, null, version).then((ruleset) => {
				if (!ruleset) {
					res.status(404).send(`Unable to retrieve ruleset '${id}'.`);
					return;
				}

				var rules = [];
				for (var i = 0; i < ruleset.rules.length; i++) {
					const rule = ruleset.rules[i];
					const ruleFilename = rule.filename;
                    if (!rule.hasOwnProperty('name'))
                        rule.name = ruleFilename;	// Make sure the rule has a name.
					if (rule.hasOwnProperty('config')) {
                        if (!rule.config.hasOwnProperty('id'))
                            rule.config.id = Util.createGUID();	// Make sure the rule has an ID.
                    }
					rules.push(
						{
							filename: ruleFilename,
							name: rule.name,
							config: rule.config
						});
				}

				let parser = null;
				if(ruleset.parser) {
					parser = {
						filename: ruleset.parser.filename,
						name: ruleset.parser.filename,
						config: ruleset.parser.config
					};
				}

				res.json({
					data: {
						type: "ruleset",
						id: id,	// The filename is used for the id.
						attributes: {
							name: ruleset.name,		// The ruleset's name is used here. This will be displayed in the UI.
							filename: ruleset.filename,
							"ruleset-id": ruleset.ruleset_id,
							"database-id": ruleset.id,
							import: ruleset.import,
							export: ruleset.export,
							parser: parser,
							rules: rules,
							config: ruleset.config
						}
					}
				});
			}, (error) => {
				next(error);
			}).catch(next);


		} else {

			let page = parseInt(req.query.page, 10);
			let size = parseInt(req.query.perPage, 10);

			if(isNaN(page)) {
				page = 1;
			}

			if(isNaN(size)) {
				size = 0;
			}

			this.config.data.getRulesets(page, size).then((result) => {
				const rulesets = [];

				let rawRulesets = result.rulesets;

				rawRulesets.forEach(ruleset => {
					ruleset["ruleset-id"] = ruleset.ruleset_id;
					delete ruleset.ruleset_id;

					ruleset["database-id"] = ruleset.id;
					delete ruleset.id;

					rulesets.push({
						type: "ruleset",
						id: ruleset["ruleset-id"] || ruleset.filename,
						attributes: ruleset
					})
				});

				res.json({ data: rulesets, meta: {totalPages: result.pageCount}});

			}, (error) => {
				next(error);
			}).catch(next);

		}
	}

	patch(req, res, next) {
		const ruleset = new RuleSet(req.body);
		this.config.data.saveRuleSet(ruleset).then(() => {
            res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
		}, (error) => {
			next(error);
		}).catch(next);
	}

	delete(req, res, next) {
        const ruleset = new RuleSet(req.body);
        this.config.data.deleteRuleSet(ruleset).then(() => {
            res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
        }, (error) => {
			next(error);
		}).catch(next);
	}

	insert(req, res, next) {
		let new_rulesetId = req.body.rulesetId;

		this.config.data.rulesetExists(new_rulesetId).then((exists) => {
			if(exists) {
				res.status(422).send(`Ruleset '${new_rulesetId}' already exsists.`);
				return;
			}

			let ruleset = null;

			if(req.body.ruleset) {
				req.body.ruleset.filename = new_rulesetId;
				req.body.ruleset.ruleset_id = new_rulesetId;
				ruleset = new RuleSet(req.body.ruleset);
			} else {
				ruleset = new RuleSet({
					filename: new_rulesetId,
					ruleset_id: new_rulesetId
				})
			}

			this.config.data.saveRuleSet(ruleset).then((name) => {
				res.status(201).location('/ruleset/' + name).json(req.body);

			}, (error) => {
				next(error);
			}).catch(next);

		}, (error) => {
			next(error);
		}).catch(next);
	}
}

module.exports = RulesetRouter;
