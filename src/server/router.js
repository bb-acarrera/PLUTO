// This code could easily be included in the server class directly but splitting it out in this simple form
// makes it easier to add new routes.
const express = require('express');

const ValidationRouter = require('./routes/validation');
const RulesetRouter = require('./routes/rulesets');
const LogsRouter = require('./routes/logs');

class Router {
	constructor(config) {
		this._router = express.Router();

		this.validationRouter = new ValidationRouter(config);
		this.rulesetRouter = new RulesetRouter(config);
		this.logsRouter = new LogsRouter(config);

		this._router.get('/validation', (req, res) => this.validationRouter.get(req, res) );
		this._router.get('/rulesets/:id', (req, res) => this.rulesetRouter.get(req, res) );
		this._router.get('/logs/:id', (req, res) => this.logsRouter.get(req, res) );

		this._router.patch('/rulesets/:id', (req, res) => this.rulesetRouter.patch(req, res) );
	}

	get router() {
		return this._router;
	}
}

module.exports = Router;
