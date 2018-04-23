const BaseRouter = require('./baseRouter');
const RuleSet = require('../../validator/RuleSet');
const Util = require('../../common/Util');

function getAuth(req) {

	const adminStr = req.header('AUTH-ADMIN');
	const admin = (adminStr && adminStr.length > 0 && adminStr.toLowerCase().startsWith('t')) == true;

	return {
		user: req.header('AUTH-USER'),
		group: req.header('AUTH-GROUP'),
		admin: admin
	}
}

class RulesetRouter extends BaseRouter {
	constructor(config) {
		super(config);

		this.apiURL = '';
		this.features = {};

		if(this.config && this.config.validatorConfig) {

			if(this.config.validatorConfig.configHost) {
				let configHostProtocol = 'http';

				if(this.config.validatorConfig.configHostProtocol) {
					configHostProtocol = this.config.validatorConfig.configHostProtocol;
				}

				this.apiURL = configHostProtocol + '://' + this.config.validatorConfig.configHost + '/api/v1/';
			}

			this.features.hideTestButtons = this.config.validatorConfig.hideTestButtons;

			if(this.config.validatorConfig.exportRulesets &&
				this.config.validatorConfig.exportRulesets.hostBaseUrl &&
				typeof this.config.validatorConfig.exportRulesets.hostBaseUrl === 'string' &&
				this.config.validatorConfig.exportRulesets.hostBaseUrl.trim().length > 0) {

				this.features.showRulesetExport = true;
				this.features.exportToLabel = this.config.validatorConfig.exportRulesets.exportToLabel
			}

			this.features.allowOnlyRulesetImport = this.config.validatorConfig.allowOnlyRulesetImport;
			this.features.environmentLabel = this.config.validatorConfig.environmentLabel;
            this.features.environmentStyle = this.config.validatorConfig.environmentStyle;
			this.features.borderColor = this.config.validatorConfig.borderColor;

			this.features.showAdmin = this.config.validatorConfig.showAdmin;
            this.features.rejectAdminNavigation = this.config.validatorConfig.rejectAdminNavigation;
		}
	}

	get(req, res, next) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.

		const auth = getAuth(req);

		if(req.params.id || req.query.id) {

			let id = '';

			if(req.params.id) {
				id = req.params.id;
			} else if(req.query.id) {
				id = req.query.id;
			}

			if(id == 'me') {
				res.json({
					data: {
						type: "user",
						id: id,
						attributes: {
							userid: auth.user,
							group: auth.group,
							admin: auth.admin,
							apiurl: this.apiURL,
							features: {
								hideTestButtons: this.features.hideTestButtons,
								showRulesetExport: this.features.showRulesetExport,
								exportToLabel: this.features.exportToLabel,
								allowOnlyRulesetImport: this.features.allowOnlyRulesetImport,
								environmentLabel: this.features.environmentLabel,
                                environmentStyle: this.features.environmentStyle,
								borderColor: this.features.borderColor,
                                showAdmin: this.features.showAdmin,
                                rejectAdminNavigation: this.features.rejectAdminNavigation
							}
						}
					}
				});
			} else {
				res.status(404).send(`Unable to retrieve user '${id}'.`);
			}

		} else {

			res.status(404).send(`Must specify a user id`);

		}
	}
}

module.exports = RulesetRouter;
