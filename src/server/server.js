const fs = require("fs");
const program = require("commander");
const path = require("path");
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const util = require('util');

const app = express();

const Validator = require("../validator/validator");
const Router = require("./router");

const Util = require('../common/Util');
const Data = require('../common/dataDb');
const RuleLoader = require('../common/ruleLoader');

const fallback = require('express-history-api-fallback');

let version = "0";
if(fs.existsSync("../../package.json")) {
	version = require("../../../package.json").version;
} else if(fs.existsSync("../package.json")) {
	version = require("../../package.json").version;
}

const doSaveErrors = false;

// The class which uses ExpressJS to serve the Ember client and handle data requests.
class Server {
	constructor(config, validatorConfig, validatorConfigPath) {
		this.config = config;
		this.config.validator = new Validator(validatorConfig, Data);
		this.config.validatorConfigPath = validatorConfigPath;
		this.config.validatorConfig = validatorConfig;

		this.config.data = Data(this.config.validatorConfig);
		this.config.statusLog = [];
		this.config.rulesLoader = new RuleLoader(this.config.validator.config.rulesDirectory);

		this.port = this.config.Port || 3000;
		this.rootDir = path.resolve(this.config.rootDirectory || this.config.validator.rootDirectory || ".");
		this.config.tempDir = Util.getRootTempDirectory(validatorConfig, this.rootDir);

		this.config.runningJobs = [];
		this.config.runMaximumDuration = this.config.validatorConfig.runMaximumDuration || 600;
		this.config.hungRunPollingInterval = this.config.validatorConfig.hungRunPollingInterval || 21600

		this.router = new Router(config);

		this.assetsDirectory = path.resolve(this.rootDir, this.config.assetsDirectory || "public");
		this.shuttingDown = false;

		app.use(fileUpload());

		// app.use(bodyParser.json()); // for parsing application/json
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
			extended: true
		}));

		// Set up the routing.
		app.use((req, res, next) => {

			if(this.shuttingDown) {
				res.statusMessage = 'Server is shutting down';
				res.status(500).end();
				return;
			}

			this.router.router(req, res, next)
		});
		app.use(express.static(this.assetsDirectory));
        app.use(express.static(path.resolve(this.rootDir, "server/assets")));

		app.use(fallback('index.html', { root: this.assetsDirectory }));

		// TODO: Basic error handling. Make it a little less basic?
		if (app.get('env') === 'development') {

			app.use((err, req, res, next) => {
				console.log(req.url + ': ' + err);
				res.statusMessage = err.message || err;
				res.status(err.status || 500).end();

				var text = err.address +  " " + err.message + " on DEBUG";
				this.saveError("error", text);

			});

		} else {

            // production error handler
            // no stacktraces leaked to user
            app.use( ( err, req, res, next ) => {
                res.statusMessage = err.message || err;
                res.status( err.status || 500 ).end();

                var text = err.address + " " + err.message + "";
	            this.saveError("error", text);

            } );
		}
		
		if (this.config.hungRunPollingInterval) {
			// Check for hung processes immediately on startup.
			this.checkForHungProcesses()

			const that = this
			function checker() {
				that.checkForHungProcesses()
			}

			// Then check for hung processes on a regular schedule.
			setInterval(checker, this.config.hungRunPollingInterval * 1000);	// hungRunPollingInterval is in seconds. setInterval() requires milliseconds.
		}
	}

	saveError(type, text) {

		if(!doSaveErrors) {
			return;
		}

		this.config.data.saveError(type, text, new Date()).then(() => {

		}, () => {
			this.config.statusLog.push({type: type, time: time, message: text});
		}).catch(() => {
			this.config.statusLog.push({type: type, time: time, message: text});
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

	shutdown() {

		console.log('Got shutdown request -- cleaning up running jobs...');
		this.shuttingDown = true;


		//since the array is modified on cleanup
		const jobs = [];

		this.config.runningJobs.forEach((job) => {
			jobs.push(job);
		});

		const promises = [];

		jobs.forEach((job) => {
			promises.push(new Promise( (resolve) => {
				job.terminate(resolve);
			}));
		});

		Promise.all(promises).then(() => {}, () =>{}).catch(() => {}).then(() => {
			console.log('All jobs cleaned up -- shutting down');
			process.exit(0);
		});
	}

	checkForHungProcesses() {
		this.config.data.getRuns(1, 1000, {
			isRunning: true,
			showErrors: true,
			showWarnings: true,
			showNone: true,
			showDropped: true,
			showPassed: true,
			showFailed: true
		}).then((results) => {
			// PA: Need to check what is hung or not...
			const promises = [];

			results.runs.forEach( (run) => {
				const currTime = new Date();
				const taskTime = run.starttime;
				const diff = Math.abs((taskTime.getTime() - currTime.getTime()));

				// If diff > the run timeout plus extra then mark the run as incomplete.
				if (diff > this.config.runMaximumDuration * 2) {	// "* 2" is arbitrary. Just give the process time to really complete.
					// Clean up the run.
					promises.push(this.config.data.cleanupRun(run.id, 'Job never terminated.'));
				}
			});
	
			if (promises.length > 0) {
				// Once all the cleanup tasks are complete, log that the cleanup has been completed.
				Promise.all(promises).then(() => {}, () =>{}).catch(() => {}).then(() => {
					console.log('All hung jobs cleaned up.');
				});
			}
		}, (err) => {
			//some unknown problem getting the list
			this.error("Ruleset \"" + this.rulesetName + "\" failed. " + err);
			throw err;
		});
	}
}

let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the server or unit test? Only do the following if running as a server.

	//override the console messages to be filebeat/ES compliant (JSON)
	["log", "warn", "error", "info"].forEach(function(method) {
		var oldMethod = console[method].bind(console);
		console[method] = function(data,...args) {

			let obj = null;

			if(data !== null && typeof data === 'object') {
				obj = data;

			} else {

				obj = {
					message: util.format(data,...args),
					messageType: method
				}
			}

			obj.time = new Date();
			if(!obj.log) {
				obj.log = "plutoserver";
			}

			oldMethod.apply(
				console,
				[JSON.stringify(obj)]
			);
		};
	});


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

	let serverConfigPath = path.resolve(program.serverConfig);

	if (!fs.existsSync(serverConfigPath)) {
		console.log("Failed to find server configuration file \"" + program.serverConfig + "\".\n");
		process.exit(1);
	}



	if (!program.validatorConfig)
		program.help((text) => {
			return "A validator configuration file must be specified.\n" + text;
		});

	let validatorConfigPath = path.resolve(program.validatorConfig);

	if (!fs.existsSync(validatorConfigPath)) {
		console.log("Failed to find validator configuration file \"" + program.validatorConfig + "\".\n");
		process.exit(1);
	}

	let serverConfig = require(serverConfigPath);
	let validatorConfig = require(validatorConfigPath);

	validatorConfig = Util.recursiveSubStringReplace(validatorConfig, Util.replaceStringWithEnv);

	validatorConfig.scriptName = scriptName;

	const server = new Server(serverConfig, validatorConfig, validatorConfigPath);
	server.start();

	process.on('SIGTERM', (signal) => {
		console.log('Got SIGTERM: ' + signal);
		server.shutdown();
	});

	process.on('SIGINT', (signal) => {
		console.log('Got SIGINT: ' + signal);
		server.shutdown();
	});
}

module.exports = Server;
