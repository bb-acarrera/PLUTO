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



		this._router.get('/logs/:id', (req, res, next) => this.logsRouter.get(req, res, next) );
        this._router.get('/logs', (req, res, next) => this.logsRouter.get(req, res, next) );

		this._router.get('/rules', (req, res, next) => this.rulesRouter.getRules(req, res, next));
		this._router.get('/parsers', (req, res, next) => this.rulesRouter.getParsers(req, res, next));
		this._router.get('/importers', (req, res, next) => this.rulesRouter.getImporters(req, res, next));
		this._router.get('/exporters', (req, res, next) => this.rulesRouter.getExporters(req, res, next));
		this._router.get('/rulesetconfiguis', (req, res, next) => this.rulesRouter.getRulesetConfigUI(req, res, next));
		this._router.get('/reporters', (req, res, next) => this.rulesRouter.getReporters(req, res, next));

		this._router.get('/runs/:id', (req, res, next) => this.runsRouter.get(req, res, next));
		this._router.get('/runs', (req, res, next) => this.runsRouter.get(req, res, next));

		this._router.get('/rulesets', (req, res, next) => this.rulesetRouter.get(req, res, next) );
		this._router.get('/rulesets/:id', (req, res, next) => this.rulesetRouter.get(req, res, next) );
		this._router.patch('/rulesets/:id', (req, res, next) => this.rulesetRouter.patch(req, res, next) );
        this._router.delete('/rulesets/:id', (req, res, next) => this.rulesetRouter.delete(req, res, next) );
		this._router.post('/rulesets', (req, res, next) => this.rulesetRouter.insert(req, res, next) );

		this._router.get('/configuredrules', (req, res, next) => this.configuredRulesRouter.get(req, res, next) );
		this._router.get('/configuredrules/:id', (req, res, next) => this.configuredRulesRouter.get(req, res, next) );
		this._router.patch('/configuredrules/:id', (req, res, next) => this.configuredRulesRouter.patch(req, res, next) );
		this._router.delete('/configuredrules/:id', (req, res, next) => this.configuredRulesRouter.delete(req, res, next) );
		this._router.post('/configuredrules', (req, res, next) => this.configuredRulesRouter.insert(req, res, next) );

		this._router.get('/users/:id', (req, res, next) => this.userRouter.get(req, res, next));

		this._router.get('/processfile/:id', (req, res, next) => this.processFileRouter.post(req, res, next));
        this._router.post('/processfile', (req, res, next) => this.processFileRouter.post(req, res, next));
		this._router.post('/processfile/:id', (req, res, next) => this.processFileRouter.post(req, res, next));
		this._router.post('/processupload', (req, res, next) => this.processFileRouter.processUpload(req, res, next));
	}

	get router() {
		return this._router;
	}
}

module.exports = Router;
