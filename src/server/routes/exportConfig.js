const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');

const request = require('request');

function addAuth(auth, options) {
	if (auth) {
		if (!options.headers) {
			options.headers = {};
		}

		if (auth.user) {
			options.headers['AUTH-USER'] = auth.user;
		}

		if (auth.groupsAsString) {
			options.headers['AUTH-GROUP'] = auth.groupsAsString;
		}

		options.headers['AUTH-ADMIN'] = auth.admin ? 'true' : 'false';
	}
}

class ExportConfigRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	post(req, res, next) {

		if(!this.config.validatorConfig.exportRulesets || !this.config.validatorConfig.exportRulesets.hostBaseUrl) {
			res.statusMessage = 'No url specified for export service';
			res.status(500).end();
			return;
		}

		const auth = this.getAuth(req);


		if(req.body && req.body.rulesetId) {
			let rulesetId = req.body.rulesetId;

			this.config.data.retrieveRuleset(rulesetId, null, this.config.rulesLoader, null, null, auth.group, auth.admin).then((ruleset) => {
				if (!ruleset) {
					res.statusMessage = 'Unable to retrieve ' + rulesetId;
					res.status(404).end();
					return;
				}

				return ruleset;
			}, next).then((ruleset) => {
				if(!ruleset) {
					return;
				}

				let promises = [ruleset];

				//get the source info
				if(ruleset.source && ruleset.source.filename) {
					promises.push(this.getRemoteRule(ruleset.source.filename, auth));
				} else {
					promises.push(null);
				}

				//get the target info
				if(ruleset.target && ruleset.target.filename) {
					promises.push(this.getRemoteRule(ruleset.target.filename, auth));
				} else {
					promises.push(null);
				}

				return Promise.all(promises);

			}, (error) => {
				res.statusMessage = error;
				res.status(404).end();
			}).then((results) => {
				if(!results) {
					return;
				}

				let ruleset = results[0];
				let source = results[1];
				let target = results[2];

				if(source) {
					ruleset.source.filename = source;
				}

				if(target) {
					ruleset.target.filename = target;
				}

				var options = {
					url: this.config.validatorConfig.exportRulesets.hostBaseUrl + '/api/v1/importruleset/' + ruleset.ruleset_id,
					method: 'POST',
					json: ruleset

				};

				addAuth(auth, options);

				request(options, (error, response, body) => {
					if (!error && response.statusCode == 200) {
						res.statusMessage = `Saved to remote.`;
						res.status(200).end();
					} else {

						let msg = `Error saving to remote. `;

						if(response) {
							msg += `${response.statusCode}: ${response.statusMessage} `
						}

						if(error) {
							msg += `Error: ${error}`;
						}

						res.statusMessage = msg;
						res.status(500).end();
					}
				});

			}, (error) => {
				res.statusMessage = error;
				res.status(404).end();
			}).catch(next)
		} else {
			res.statusMessage = 'No ruleset specified';
			res.status(404).end();
		}

	}

	getRemoteRule(ruleId, auth) {
		return new Promise((resolve, reject) => {
			this.config.data.retrieveRule(ruleId, null, null, auth.group, auth.admin, this.config.rulesLoader).then((rule) => {
				if (!rule) {
					reject(`Unable to retrieve rule '${id}'.`);
					return;
				}

				var options = {
					url: this.config.validatorConfig.exportRulesets.hostBaseUrl + '/api/v1/configuredrules',
					qs: {
						name: rule.description,
						type: rule.type
					}
				};

				addAuth(auth, options);

				request(options, (error, response, body) => {
					if (!error && response.statusCode == 200) {

						try{
							var info = JSON.parse(body);

							resolve(info.data.attributes['rule-id']);	

							return;
						} catch(e) {
							error = e;
						}
						
						
					} 

					let msg = `Error getting remote ${rule.type} ${rule.description}. `;

					if(response) {
						msg += `${response.statusCode}: ${response.statusMessage} `
					}

					if(error) {
						msg += `Error: ${error}`;
					}

					reject(msg);
					
				});


			}, (error) => {
				reject(error);
			})
		});
	}
}



module.exports = ExportConfigRouter;