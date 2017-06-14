const fs = require("fs");
const program = require("commander");
const path = require("path");
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const Validator = require("../validator/validator");
const Router = require("./router");

const version = require("../../package.json").version;

// The class which uses ExpressJS to serve the Ember client and handle data requests.
class Server {
	constructor(config, validatorConfig) {
		this.config = config;
		this.config.validator = new Validator(validatorConfig);

		this.port = this.config.Port || 8000;
		this.rootDir = path.resolve(this.config.RootDirectory || this.config.Validator.RootDirectory || ".");
		this.router = new Router(config);
		this.assetsDirectory = path.resolve(this.rootDir, this.config.AssetsDirectory || "public");

		// app.use(bodyParser.json()); // for parsing application/json
		app.use(bodyParser.json({ type: 'application/*+json' }));

		// Set up the routing.
		app.use(this.router.router);
		app.use(express.static(this.assetsDirectory));

		// TODO: Basic error handling. Make it a little less basic?
		if (app.get('env') === 'development') {

			app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.json({
					message: err.message,
					error: err
				});
			});

		}

		// production error handler
		// no stacktraces leaked to user
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.json({
				message: err.message,
				error: {}
			});
		});
	}

	/*
	 * Start the server.
	 */
	start() {
		var that = this;
		app.listen(this.port, function () {
			console.log(`Pluto server listening on port ${that.port}!`);
		});
	}
}

let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the server or unit test? Only do the following if running as a server.
	program
		.version(version)
		.usage('[options]')
		.description('Serve the validator front end.')
		.option('-s, --serverConfig <configFile>', 'The server configuration file to use.')
		.option('-v, --validatorConfig <configFile>', 'The validator configuration file to use.')
		.parse(process.argv);

	if (!program.serverConfig)
		program.help((text) => {
			return "A server configuration file must be specified.\n" + text;
		});

	if (!fs.existsSync(program.serverConfig)) {
		console.log("Failed to find server configuration file \"" + program.serverConfig + "\".\n");
		process.exit(1);
	}

	if (!program.validatorConfig)
		program.help((text) => {
			return "A validator configuration file must be specified.\n" + text;
		});

	if (!fs.existsSync(program.validatorConfig)) {
		console.log("Failed to find validator configuration file \"" + program.validatorConfig + "\".\n");
		process.exit(1);
	}

	let serverConfig = require(program.serverConfig);
	let validatorConfig = require(program.validatorConfig);
	validatorConfig.scriptName = scriptName;

	const server = new Server(serverConfig, validatorConfig);
	server.start();
}

module.exports = Server;
