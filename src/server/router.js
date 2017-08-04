// This code could easily be included in the server class directly but splitting it out in this simple form
// makes it easier to add new routes.
const express = require('express');

const RulesetRouter = require('./routes/rulesets');
const LogsRouter = require('./routes/logs');
const RulesRouter = require('./routes/rules');
const RunsRouter = require('./routes/runs');
const ProcessFileRouter = require('./routes/processFile');

class Router {
	constructor(config) {
		this._router = express.Router();

		this.rulesetRouter = new RulesetRouter(config);
		this.logsRouter = new LogsRouter(config);
		this.rulesRouter = new RulesRouter(config);
		this.runsRouter = new RunsRouter(config);
		this.processFileRouter = new ProcessFileRouter(config);

		this._router.get('/rulesets/:id', (req, res, next) => this.rulesetRouter.get(req, res, next) );
		this._router.get('/rulesets', (req, res, next) => this.rulesetRouter.get(req, res, next) );
		this._router.get('/logs/:id', (req, res, next) => this.logsRouter.get(req, res, next) );
		this._router.get('/rules', (req, res, next) => this.rulesRouter.get(req, res, next));
		this._router.get('/runs/:id', (req, res, next) => this.runsRouter.get(req, res, next));
		this._router.get('/runs', (req, res, next) => this.runsRouter.get(req, res, next));

		this._router.patch('/rulesets/:id', (req, res, next) => this.rulesetRouter.patch(req, res, next) );

        this._router.delete('/rulesets/:id', (req, res, next) => this.rulesetRouter.delete(req, res, next) );

        this._router.post('/processfile', (req, res, next) => this.processFileRouter.post(req, res, next));
	}

	get router() {
		return this._router;
	}
}

module.exports = Router;
