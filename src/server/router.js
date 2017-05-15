// This code could easily be included in the server class directly but splitting it out in this simple form
// makes it easier to add new routes.
const express = require('express');

const ValidationRouter = require('./routes/validation');
const RulesetRouter = require('./routes/rulesets');
const LogsRouter = require('./routes/logs');

// const RulesRouter = require('./routes/rules');	// Obsolete. I'm keeping this code though in case I need a new rules route.

class Router {
	constructor(config) {
		this._router = express.Router();

		this.validationRouter = new ValidationRouter(config);
		this.rulesetRouter = new RulesetRouter(config);
		this.logsRouter = new LogsRouter(config);
		// this.rulesRouter = new RulesRouter(config);

		this._router.get('/validation', (req, res) => this.validationRouter.route(req, res) );
		this._router.get('/rulesets/:id', (req, res) => this.rulesetRouter.route(req, res) );
		this._router.get('/logs/:id', (req, res) => this.logsRouter.route(req, res) );
		// this._router.get('/rules/:id', (req, res) => this.rulesRouter.route(req, res) );
	}

	get router() {
		return this._router;
	}
}

module.exports = Router;
