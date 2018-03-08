// This code could easily be included in the server class directly but splitting it out in this simple form
// makes it easier to add new routes.
const express = require('express');

const RulesetRouter = require('./routes/rulesets');
const LogsRouter = require('./routes/logs');
const RulesRouter = require('./routes/rules');
const RunsRouter = require('./routes/runs');
const ProcessFileRouter = require('./routes/processFile');
const UserRouter = require('./routes/user');
const ConfiguredRulesRouter = require('./routes/configuredRules');
const StatusRouter = require('./routes/status');

const base = '/api/v1';

class Router {
	constructor(config) {
		this._router = express.Router();

		this.rulesetRouter = new RulesetRouter(config);
		this.logsRouter = new LogsRouter(config);
		this.rulesRouter = new RulesRouter(config);
		this.runsRouter = new RunsRouter(config);
		this.processFileRouter = new ProcessFileRouter(config);
		this.userRouter = new UserRouter(config);
		this.configuredRulesRouter = new ConfiguredRulesRouter(config);
		this.statusRouter = new StatusRouter(config);



		this._router.get(base+'/logs/:id', (req, res, next) => this.logsRouter.get(req, res, next) );
        this._router.get(base+'/logs', (req, res, next) => this.logsRouter.get(req, res, next) );

		this._router.get(base+'/rules', (req, res, next) => this.rulesRouter.getRules(req, res, next));
		this._router.get(base+'/parsers', (req, res, next) => this.rulesRouter.getParsers(req, res, next));
		this._router.get(base+'/importers', (req, res, next) => this.rulesRouter.getImporters(req, res, next));
		this._router.get(base+'/exporters', (req, res, next) => this.rulesRouter.getExporters(req, res, next));
		this._router.get(base+'/rulesetconfiguis', (req, res, next) => this.rulesRouter.getRulesetConfigUI(req, res, next));
		this._router.get(base+'/reporters', (req, res, next) => this.rulesRouter.getReporters(req, res, next));
        this._router.get(base+'/customfields', (req, res, next) => this.rulesRouter.getCustomFields(req, res, next));
        this._router.get(base+'/periodicities', (req, res, next) => this.rulesRouter.getPeriodicity(req, res, next));

		this._router.get(base+'/runs/:id', (req, res, next) => this.runsRouter.get(req, res, next));
		this._router.get(base+'/runs', (req, res, next) => this.runsRouter.get(req, res, next));

		this._router.get(base+'/rulesets', (req, res, next) => this.rulesetRouter.get(req, res, next) );
		this._router.get(base+'/rulesets/:id', (req, res, next) => this.rulesetRouter.get(req, res, next) );
		this._router.patch(base+'/rulesets/:id', (req, res, next) => this.rulesetRouter.patch(req, res, next) );
        this._router.delete(base+'/rulesets/:id', (req, res, next) => this.rulesetRouter.delete(req, res, next) );
		this._router.post(base+'/rulesets', (req, res, next) => this.rulesetRouter.insert(req, res, next) );

		this._router.get(base+'/configuredrules', (req, res, next) => this.configuredRulesRouter.get(req, res, next) );
		this._router.get(base+'/configuredrules/:id', (req, res, next) => this.configuredRulesRouter.get(req, res, next) );
		this._router.patch(base+'/configuredrules/:id', (req, res, next) => this.configuredRulesRouter.patch(req, res, next) );
		this._router.delete(base+'/configuredrules/:id', (req, res, next) => this.configuredRulesRouter.delete(req, res, next) );
		this._router.post(base+'/configuredrules', (req, res, next) => this.configuredRulesRouter.insert(req, res, next) );

		this._router.get(base+'/users/:id', (req, res, next) => this.userRouter.get(req, res, next));

		this._router.get(base+'/processfile/:id', (req, res, next) => this.processFileRouter.post(req, res, next));
        this._router.post(base+'/processfile', (req, res, next) => this.processFileRouter.post(req, res, next));
		this._router.post(base+'/processfile/:id', (req, res, next) => this.processFileRouter.post(req, res, next));
		this._router.post(base+'/processupload', (req, res, next) => this.processFileRouter.processUpload(req, res, next));

        this._router.get(base+'/statuses', (req, res, next) => this.statusRouter.get(req, res, next) );
	}

	get router() {
		return this._router;
	}
}

module.exports = Router;
