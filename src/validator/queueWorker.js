const fs = require("fs");
const program = require("commander");
const path = require("path");
const util = require('util');
const amqp = require('amqplib');
const child_process = require('child_process');
const TreeKill = require('tree-kill');
const rimraf = require('rimraf');

const ErrorHandlerAPI = require("../api/errorHandlerAPI");
const ErrorLogger = require("./ErrorLogger");

const Util = require('../common/Util');

const Data = require('../common/dataDb');

var PlutoQueue = 'pluto_runs';

let version = "0";
if(fs.existsSync("../../package.json")) {
	version = require("../../../package.json").version;
} else if(fs.existsSync("../package.json")) {
	version = require("../../package.json").version;
}

//get the root PLUTO folder from this file
const rootFolder = path.resolve(__dirname, '../');

class QueueWorker {
	constructor(config) {
		this.config = config;
		
		
		this.rootDir = path.resolve(this.config.rootDirectory || ".");
        this.config.tempDir = Util.getRootTempDirectory(this.config, this.rootDir);
        
        this.config.data = Data(this.config);

		this.config.runMaximumDuration = this.config.runMaximumDuration || 600;
		
        this.shuttingDown = false;
        
        this.queue = PlutoQueue;

        this.currentJob = null;

		
	}

	/*
	 * Start the server.
	 */
	start() {
		amqp.connect(this.config.rabbitMQ).then((conn) => {

            this.amqpConn = conn;

            return conn.createChannel();

        }, (err) => {
            console.log("Error connecting to RabbitMQ: " + err);
            process.exit(1);
        }).then((ch) => {
            ch.assertQueue(this.queue, {durable: true});
            ch.prefetch(1);
        
            console.log('Waiting for jobs');

            ch.consume(this.queue, 
                (msg) => {

                    if(this.shuttingDown) {
                       ch.nack(msg);
                       return;
                    }

                    this.currentJob = this.handleJob(msg, ch).then(() => {
                        this.currentJob = null;
                        ch.ack(msg);
                    }, () => {
                        ch.nack(msg);
                    }).catch((e)=>{
                        console.log('Unhandled exception: ' + e);
                        ch.nack(msg);
                    }).then(() => {
                        if(this.shuttingDown) {
                            return ch.cancel(msg.fields.consumerTag);
                        }
                    })

                    
                }, 
                {noAck: false});

        }, (err) => {
            console.log("Error creating channel: " + err);
            process.exit(1);
        }).catch((e) => {
            console.log("Got exception: " + e);
            process.exit(1);
        })
    }

    handleJob(msg) {

        let req;

        try {
            req = JSON.parse(msg.content.toString());
        } catch(e) {
            console.log('Could not parse msg: ' + e);
            resolve();
            return Promise.resolve();
        }

        return this.processFile(req.ruleset, req.importConfig, req.test, req.skipMd5Check, req.user, req.group);

        
    }

    processFile(ruleset, importConfig, test, skipMd5Check, user, group) {
        return new Promise((resolve, reject) => {

            let finishedFn = null;
            let inputFile = null;
            let outputFile = null;
            let inputDisplayName = null;

            if(test) {
                outputFile = this.getTempName(this.config);

                finishedFn = () => {

                    if (fs.existsSync(outputFile)) {
                        fs.unlink(outputFile);
                    }
                }
            }



            let scriptPath = path.resolve(rootFolder, 'validator');

            var execCmd = 'node ' + scriptPath + '/startValidator.js -r ' + ruleset + ' -c "' + this.config.validatorConfigPath + '"';
            var spawnCmd = 'node';
            var spawnArgs = [scriptPath + '/startValidator.js', '-r', ruleset, '-c', this.config.validatorConfigPath];
            let overrideFile = null;

            if (importConfig) {
                overrideFile = this.getTempName(this.config) + '.json';
                fs.writeFileSync(overrideFile, JSON.stringify({import: importConfig}), 'utf-8');
                execCmd += ' -v "' + overrideFile + '"';
                spawnArgs.push('-v');
                spawnArgs.push(overrideFile);
            } else {
            	if (inputFile) {
                    execCmd += ' -i "' + inputFile + '"';
                    spawnArgs.push('-i');
                    spawnArgs.push(inputFile);
            	}
            	if (outputFile) {
                    execCmd += ' -o "' + outputFile + '"';
                    spawnArgs.push('-o');
                    spawnArgs.push(outputFile);
            	}
                if(inputDisplayName) {
                    execCmd += ' -n "' + inputDisplayName + '"';

                    spawnArgs.push('-n');
                    spawnArgs.push(inputDisplayName);
                }
                if (user) {
                    execCmd += ' -u "' + user + '"';

                    spawnArgs.push('-u');
                    spawnArgs.push(user);
                }
                if (group) {
                    execCmd += ' -g "' + group + '"';

                    spawnArgs.push('-g');
                    spawnArgs.push(group);
                }
            }

            if (test) {
                execCmd += ' -t';
                spawnArgs.push('-t');
            } else if (!skipMd5Check) {
                execCmd += ' -h';
                spawnArgs.push('-h');
            }



            const options = {
                cwd: path.resolve('.')
            };

            console.log('exec cmd: ' + execCmd);


            let proc = child_process.spawn(spawnCmd, spawnArgs, options);

            let terminationMessage = null;
            let runId = null;

            // Called when the timeout lapses.
            function runTimeout() {
                console.log({
                    log: "plutorun",
                    runId: runId,
                    state: "running",
                    messageType: "log",
                    message: `Child process took too long. Terminating.`
                });

                terminationMessage = `Run took too long and was terminated by the server.`;
                TreeKill(proc.pid);
            }

            const timeoutId = setTimeout(runTimeout, this.config.runMaximumDuration * 1000);

            let tempFolder = null;

            let fullLog = '';

            // Called when the process is finished either by exitting or because of an error.
            const finished = () => {

                clearTimeout(timeoutId);

                if(overrideFile) {
                    fs.unlink(overrideFile);
                }

                if(tempFolder && fs.existsSync(tempFolder)) {
                    rimraf.sync(tempFolder, null, (e) => {
                        console.log('Unable to delete folder: ' + tempFolder + '.  Reason: ' + e);
                    });
                }
        
                this.config.data.cleanupRun(runId, terminationMessage, fullLog)
                    .then(() => {}, () => {}).catch(() => {}).then(() => {

                        if(finishedFn) {
                            finishedFn();
                        }
                        resolve();
                })


            };

            proc.on('error', (err) => {

                let message = "unable to start validator: " + err;

                fullLog += message + '\n';

                console.error(message);

                finished();

            });

            proc.stdout.on('data', (data) => {

                fullLog += 'stdout: ' + data + '\n';

                Util.splitConsoleOutput(data.toString()).forEach((str) => {
                    let log = null;

                    try {
                        log = JSON.parse(str);
                    } catch (e) {

                    }

                    if (log) {

                        if (log.state && log.state === "start") {
                            runId = log.runId;
                            tempFolder = log.tempFolder;
                        }

                        log.log = "plutorun";
                        log.runId = runId;
                        log.state = log.state || "running";
                        log.user = user
                        log.group = group

                        console.log(log);

                    } else {

                        console.log({
                            log: "plutorun",
                            runId: runId,
                            state: "running",
                            messageType: "log",
                            message: str,
                            user: user,
                            group: group
                        });

                    }
                });
            });

            proc.stderr.on('data', (data) => {

                fullLog += 'stderr: ' + data + '\n';

                Util.splitConsoleOutput(data.toString()).forEach((str) => {
                    console.log({
                        log: "plutorun",
                        runId: runId,
                        state: "running",
                        messageType: "error",
                        message: str,
                        user: user,
                        group: group
                    });
                });

            });

            proc.on('exit', (code) => {

                console.log({
                    log: "plutorun",
                    runId: runId,
                    state: "exit",
                    exitCode: code,
                    user: user,
                    group: group
                });


                finished();
            });


        });
    }
    
	shutdown() {

		console.log('Got shutdown request');
        this.shuttingDown = true;
        
        if(!this.currentJob) {
            this.currentJob = Promise.resolve();
        } 

        //need to put a wait in since the ack takes sometime but doesn't indicate when done
        this.currentJob.then(() => {}, ()=>{}).catch(()=>{}).then(()=>{

            console.log('All jobs finished, closing connection to RabbitMQ');

            if(this.amqpConn) {
                return this.amqpConn.close();
            }

            return;
        }).then(() => {}, ()=>{}).catch(()=>{}).then(()=>{
            console.log('RabbitMQ connection closed');
            process.exit(0);
        })

	}

    // Create a unique temporary filename in the temp directory.
    getTempName(config) {
        const dirname = config.tempDir;
        const filename = Util.createGUID();
        return path.resolve(dirname, filename);
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
				obj.log = "plutoworker";
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
		.description('Validator worker that pulls jobs off a queue')
		.option('-v, --validatorConfig <configFile>', 'The validator configuration file to use.')
		.parse(process.argv);


	if (!program.validatorConfig)
		program.help((text) => {
			return "A validator configuration file must be specified.\n" + text;
		});

	let validatorConfigPath = path.resolve(program.validatorConfig);

	if (!fs.existsSync(validatorConfigPath)) {
		console.log("Failed to find validator configuration file \"" + program.validatorConfig + "\".\n");
		process.exit(1);
	}

	let validatorConfig = require(validatorConfigPath);

	validatorConfig = Util.recursiveSubStringReplace(validatorConfig, Util.replaceStringWithEnv);

    validatorConfig.scriptName = scriptName;
    validatorConfig.validatorConfigPath = validatorConfigPath;

	const server = new QueueWorker(validatorConfig);
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

module.exports = QueueWorker;
