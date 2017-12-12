const BaseRouter = require('./baseRouter');
const RuleSet = require('../../validator/RuleSet');
const Util = require('../../common/Util');

function massageRule(rule, rulesLoader) {
	rule["rule-id"] = rule.rule_id;
	delete rule.rule_id;

	let id = rule.id;

	rule["database-id"] = id;
	delete rule.id;

	rule["owner-group"] = rule.owner_group;
	delete rule.owner_group;

	rule["update-user"] = rule.update_user;
	delete rule.update_user;

	rule["update-time"] = rule.update_time;
	delete rule.update_time;

	if(!rule.config) {
		rule.config = {};
	}

	rule.ui = {
		properties: []
	};

	if(rulesLoader) {
		let baseRule = null;
		if(rule.base) {
			baseRule = rulesLoader.rulePropertiesMap[rule.base];
		}

		if(baseRule && baseRule.attributes && baseRule.attributes.ui && baseRule.attributes.ui.properties) {
			baseRule.attributes.ui.properties.forEach((prop) => {
				if(rule.config[prop.name] == null && prop.private !== true && prop.hidden !== true) {
					rule.ui.properties.push(prop);
				}
			});
		}
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

			this.config.data.retrieveRule(id, version, dbId, auth.group, auth.admin, this.config.rulesLoader).then((rule) => {
				if (!rule) {
					res.statusMessage = `Unable to retrieve rule '${id}'.`;
					res.status(404).end();
					return;
				}

				rule = massageRule(rule, this.config.rulesLoader);

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
				typeFilter: req.query.typeFilter,
				ownerFilter: req.query.ownerFilter,
				descriptionFilter: req.query.descriptionFilter
			}, auth.group, auth.admin, this.config.rulesLoader).then((result) => {
				const rules = [];

				result.rules.forEach(rule => {

					rule = massageRule(rule, this.config.rulesLoader);

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


		function createRule(ruleId) {
			let rule = null;

			if (req.body.rule) {
				req.body.rule.rule_id = ruleId;
				rule = req.body.rule;
			} else {
				rule = {
					rule_id: ruleId
				};
			}

			this.config.data.saveRule(rule, auth.user, auth.group, auth.admin).then((id) => {
				res.status(201).location('/configuredRule/' + id).json(rule);

			}, (error) => {
				next(error);
			}).catch(next);
		}

		if(new_ruleId) {
			this.config.data.ruleExists(new_ruleId).then((exists) => {
				if(exists) {
					res.statusMessage = `Rule '${new_ruleId}' already exists.`;
					res.status(422).end();
					return;
				}

				createRule.call(this, new_ruleId);

			}, (error) => {
				next(error);
			}).catch(next);
		} else {
			createRule.call(this);
		}


	}
}

module.exports = ConfiguredRuleRouter;
