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

		const auth = this.getAuth(req);

		if(req.params.id || req.query.id || req.query.dbid) {

			let id = '';
			let version = null;
			let dbId = null;

			if(req.params.id) {
				id = req.params.id;
			} else if(req.query.id) {
				id = req.query.id;
			} else if(req.query.dbid) {
				dbId = req.query.dbid;
				id = null;
			}

			if(req.query.version) {
				version = req.query.version;
			}

			this.config.data.retrieveRuleset(id, null, this.config.rulesLoader, version, dbId, auth.group, auth.admin).then((ruleset) => {
				if (!ruleset) {
					res.statusMessage = 'Unable to retrieve ' + (id || dbId);
					res.status(404).end();
					return;
				}

				ruleset.addMissingData(this.config.validatorConfig);

				ruleset["ruleset-id"] = ruleset.ruleset_id;
				delete ruleset.ruleset_id;

				dbId = ruleset.id;

				ruleset["database-id"] = dbId;
				delete ruleset.id;

				if(ruleset.source || ruleset.target) {
					if(ruleset.source) {
						ruleset.sourcedetails = ruleset.source.filename;
					}
					if(ruleset.target) {
						ruleset.targetdetails = ruleset.target.filename;
					}
				}

				let jsonResp = {
					data: {
						type: "ruleset",
						id: dbId,
						attributes: ruleset
					}
				};

				res.json(jsonResp);

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

			this.config.data.getRulesets(page, size, {
				rulesetFilter: req.query.rulesetFilter,
				groupFilter: req.query.groupFilter,
				sourceDescriptionFilter: req.query.sourceDescriptionFilter,
				fileFilter: req.query.fileFilter,
				nameFilter: req.query.nameFilter

			}, this.config.rulesLoader, auth.group, auth.admin).then((result) => {
				const rulesets = [];

				let rawRulesets = result.rulesets;

				rawRulesets.forEach(ruleset => {

					ruleset.addMissingData(this.config.validatorConfig);

					ruleset["ruleset-id"] = ruleset.ruleset_id;
					delete ruleset.ruleset_id;

					let id = ruleset.id;

					ruleset["database-id"] = id;
					delete ruleset.id;

					if(ruleset.source || ruleset.target) {
						if(ruleset.source) {
							ruleset.sourcedetails = ruleset.source.filename;
						}
						if(ruleset.target) {
							ruleset.targetdetails = ruleset.target.filename;
						}
					}

					rulesets.push({
						type: "ruleset",
						id: id,
						attributes: ruleset
					})
				});

				res.json(
					{
						data: rulesets,
						meta: {rowCount: result.rowCount, totalPages: result.pageCount}
					});

			}, (error) => {
				next(error);
			}).catch(next);

		}
	}

	patch(req, res, next) {

		if(this.config.allowOnlyRulesetImport) {
			res.statusMessage = 'Only imports allowed';
			res.status(405).end();
			return;
		}

		const auth = this.getAuth(req);

		function saveFn(ruleset) {
			this.config.data.saveRuleSet(ruleset, auth.user, auth.group, auth.admin).then((ruleset) => {
				res.json(ruleset);	// Need to reply with what we received to indicate a successful PATCH.
			}, (error) => {
				next(error);
			}).catch(next);
		}

		this.save(req, res, next, saveFn)
	}

	import(req, res, next) {

		const auth = this.getAuth(req);

		function saveFn(ruleset) {
			this.config.data.saveRuleSet(ruleset, auth.user, auth.group, auth.admin, true).then((ruleset) => {
				res.json(ruleset);
			}, (error) => {
				next(error);
			}).catch(next);
		}

		this.save(req, res, next, saveFn)
	}

	save(req, res, next, saveFn) {

		const ruleset = new RuleSet(req.body, this.config.rulesLoader);

		if(this.config.validatorConfig.forceUniqueTargetFile) {
			this.config.data.rulesetValid(ruleset, false, this.config.validatorConfig.forceUniqueTargetFile).then(() => {

				saveFn.call(this, ruleset);

			}, (error) => {

				res.statusMessage = error;
				res.status(422).end();

			}).catch(next);
		} else {
			saveFn.call(this, ruleset);
		}
	}

	delete(req, res, next) {
		const auth = this.getAuth(req);
        const ruleset = new RuleSet(req.body);
        this.config.data.deleteRuleSet(ruleset, auth.user, auth.group, auth.admin).then(() => {
            res.json(req.body);	// Need to reply with what we received to indicate a successful PATCH.
        }, (error) => {
			next(error);
		}).catch(next);
	}

	insert(req, res, next) {

		if(this.config.allowOnlyRulesetImport) {
			res.statusMessage = 'Only imports allowed';
			res.status(405).end();
			return;
		}

		const auth = this.getAuth(req);
		let new_rulesetId = req.body.rulesetId;

		let ruleset = null;

		if(req.body.ruleset) {
			req.body.ruleset.filename = new_rulesetId;
			req.body.ruleset.ruleset_id = new_rulesetId;
			ruleset = new RuleSet(req.body.ruleset, this.config.rulesLoader);
			ruleset.addMissingData(this.config.validatorConfig);
		} else {
			ruleset = new RuleSet({
				filename: new_rulesetId,
				ruleset_id: new_rulesetId
			})
		}

		this.config.data.rulesetValid(ruleset, true, this.config.validatorConfig.forceUniqueTargetFile).then(() => {

			this.config.data.saveRuleSet(ruleset, auth.user, auth.group, auth.admin).then((ruleset) => {
				res.status(201).location('/ruleset/' + ruleset.ruleset_id).json(ruleset);

			}, (error) => {
				next(error);
			}).catch(next);

		}, (error) => {

			res.statusMessage = error;
			res.status(422).end();

		}).catch(next);
	}
}

module.exports = RulesetRouter;
