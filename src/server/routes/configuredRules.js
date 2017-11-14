const BaseRouter = require('./baseRouter');
const RuleSet = require('../../validator/RuleSet');
const Util = require('../../common/Util');

function massageRule(rule) {
	rule["rule-id"] = rule.rule_id;
	delete rule.rule_id;

	let id = rule.id;

	rule["database-id"] = id;
	delete rule.id;

	if(!rule.config) {
		rule.config = {};
	}

	return rule;
}

class ConfiguredRuleRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res, next) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.

		const auth = this.getAuth(req);

		if(req.params.id || req.query.id || req.query.dbid) {

			let id = '';
			let version = null;
			let dbId = null;

			if(req.params.id) {
				id = req.params.id;
			} else if(req.query.id) {
				id = req.query.id;
			}

			if(req.query.version) {
				version = req.query.version;
			}

			this.config.data.retrieveRule(id, version, dbId, auth.group, auth.admin).then((rule) => {
				if (!rule) {
					res.statusMessage = `Unable to retrieve rule '${id}'.`;
					res.status(404).end();
					return;
				}

				rule = massageRule(rule);

				res.json({
					data: {
						type: "configuredrule",
						id: rule["database-id"],
						attributes: rule
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

			this.config.data.getRules(page, size, {
				ruleFilter: req.query.ruleFilter,
				groupFilter: req.query.groupFilter,
				typeFilter: req.query.typeFilter
			}).then((result) => {
				const rules = [];

				result.rules.forEach(rule => {

					rule = massageRule(rule);

					rules.push({
						type: "configuredrule",
						id: rule["database-id"],
						attributes: rule
					})
				});

				res.json(
					{
						data: rules,
						meta: {rowCount: result.rowCount, totalPages: result.pageCount}
					});

			}, (error) => {
				next(error);
			}).catch(next);

		}
	}

	patch(req, res, next) {
		const auth = this.getAuth(req);
		const rule = req.body;
		this.config.data.saveRule(rule, auth.user, auth.group, auth.admin).then(() => {
            req.body.version = rule.version;
			res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
		}, (error) => {
			next(error);
		}).catch(next);
	}

	delete(req, res, next) {
		const auth = this.getAuth(req);
		const rule = req.body;
        this.config.data.deleteRule(rule, auth.user, auth.group, auth.admin).then(() => {
            res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
        }, (error) => {
			next(error);
		}).catch(next);
	}

	insert(req, res, next) {
		const auth = this.getAuth(req);
		let new_ruleId = req.body.ruleId;

		this.config.data.ruleExists(new_ruleId).then((exists) => {
			if(exists) {
				res.statusMessage = `Rule '${new_ruleId}' already exists.`;
				res.status(422).end();
				return;
			}

			let rule = null;

			if(req.body.rule) {
				req.body.rule.rule_id = new_ruleId;
				rule = req.body.rule;
			} else {
				rule = {
					rule_id: new_ruleId
				};
			}

			this.config.data.saveRule(rule, auth.user, auth.group, auth.admin).then((name) => {
				res.status(201).location('/configuredRule/' + name).json(req.body);

			}, (error) => {
				next(error);
			}).catch(next);

		}, (error) => {
			next(error);
		}).catch(next);
	}
}

module.exports = ConfiguredRuleRouter;