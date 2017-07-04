// This code could easily be included in the server class directly but splitting it out in this simple form
// makes it easier to add new routes.
const express = require('express');

const ValidationRouter = require('./routes/validation');
const RulesetRouter = require('./routes/rulesets');
const LogsRouter = require('./routes/logs');
const RulesRouter = require('./routes/rules');
const RunsRouter = require('./routes/runs');
const ProcessFileRouter = require('./routes/processFile');

class Router {
	constructor(config) {
		this._router = express.Router();

		this.validationRouter = new ValidationRouter(config);
		this.rulesetRouter = new RulesetRouter(config);
		this.logsRouter = new LogsRouter(config);
		this.rulesRouter = new RulesRouter(config);
		this.runsRouter = new RunsRouter(config);
		this.processFileRouter = new ProcessFileRouter(config);

		//this._router.get('/validation', (req, res) => this.validationRouter.get(req, res) );
		this._router.get('/rulesets/:id', (req, res) => this.rulesetRouter.get(req, res) );
		this._router.get('/rulesets', (req, res) => this.rulesetRouter.get(req, res) );
		this._router.get('/logs/:id', (req, res) => this.logsRouter.get(req, res) );
		this._router.get('/rules', (req, res) => this.rulesRouter.get(req, res));
		this._router.get('/runs/:id', (req, res) => this.runsRouter.get(req, res));
		this._router.get('/runs', (req, res) => this.runsRouter.get(req, res));

		this._router.patch('/rulesets/:id', (req, res) => this.rulesetRouter.patch(req, res) );

		this._router.post('/processfile', (req, res) => this.processFileRouter.post(req, res))
	}

	get router() {
		return this._router;
	}
}

module.exports = Router;
