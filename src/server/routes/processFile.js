const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');

const child_process = require('child_process');
const fs = require('fs-extra');
const path = require("path");

const TreeKill = require('tree-kill');
const rimraf = require('rimraf');

const amqp = require('amqplib');

const ErrorHandlerAPI = require("../../api/errorHandlerAPI");
const ErrorLogger = require("../../validator/ErrorLogger");

//get the root PLUTO folder from this file
const rootFolder = path.resolve(__dirname, '../../');

const useQueue = true;
var PlutoQueue = 'pluto_runs';

/*
example request
{
    ruleset: "someruleset",
    import: {
        ...
    }
}

 */

class ProcessFileRouter extends BaseRouter {
    constructor(config) {
        super(config);
        this.processCount = 0;
        this.queue = PlutoQueue;
    }

    post(req, res, next) {
        // Note that in general the server and validator can have different root directories.
        // The server's root directory points to the client code while the validator's root
        // directory points to rulesets, rule plugins and such. It can be configured such
        // that these two root directories are the same.

        console.log('got processFile request');

        const auth = this.getAuth(req);

        let ruleset = null;
        if(req.params.id) {
            ruleset = req.params.id;
        } else if(req.body) {
            ruleset = req.body.ruleset;
        }

        let inputFile;
        let outputFile;
        let importConfig;
        let test;
        let skipMd5Check;
        let sourceFile;

        if(req.body) {
            inputFile = req.body.input;
            outputFile = req.body.output;
            importConfig = req.body.import;
            test = req.body.test;
            sourceFile = req.body.source_file;
            skipMd5Check = req.body.skipMd5Check;
        }

        let prepProcessFile = () => {
            let finishHandler = null;

            if(!ruleset) {
                res.statusMessage = 'Failed to start: no ruleset or source_file specified';
                res.status(422).send('Failed to start: no ruleset or source_file specified');

                return;
            }

            let jobPromise = null;

            if(useQueue) {
                if(test) {
                    outputFile = this.getTempName(this.config);
    
                    finishHandler = () => {
    
                        if (fs.existsSync(outputFile)) {
                            fs.unlink(outputFile);
                        }
                    }
                }
    
                jobPromise = this.processFile(ruleset, importConfig, inputFile, outputFile, null,
                    next, res, test, finishHandler, auth.user, auth.group, skipMd5Check);
            } else {
                jobPromise = this.addToQueue(ruleset, importConfig, inputFile, outputFile, null,
                    next, res, test, finishHandler, auth.user, auth.group, skipMd5Check);
            }
            

            this.generateResponse(res, ruleset, jobPromise);
        };

        if(sourceFile && !ruleset) {
            this.config.data.getRulesets(1, 5, {
                fileExactFilter: sourceFile
            }).then((result) => {
                if(result.rulesets.length == 1) {
                    ruleset = result.rulesets[0].ruleset_id;

                    prepProcessFile();

                } else if(result.rulesets.length > 1) {
                    let msg = `Too many ${sourceFile} matched. Got ${result.rulesets.length}, should only be 1.`;
                    res.statusMessage = msg;
                    res.status(422).send(msg);
                } else {
                    res.statusMessage = `${sourceFile} not found.`;
                    res.status(404).send(`${sourceFile} not found.`);
                }
            }, (error) => {
                next(error);
            }).catch(next);
        } else {

            this.config.data.rulesetExists(ruleset).then((exists) => {

                if(exists) {
                    prepProcessFile();
                } else {
                    res.statusMessage = `${ruleset} not found.`;
                    res.status(404).send(`${ruleset} not found.`);
                }

            }, (error) => {
                next(error);
            }).catch(next);


        }


    }

    processUpload(req, res, next) {
        if (!req.files)
            return res.status(400).send('No files were uploaded.');

        // The name of the input field is used to retrieve the uploaded file
        let file = req.files.file;

        let fileToProcess = this.getTempName(this.config);
        let ruleset = req.body.ruleset;
        let outputFile = this.getTempName(this.config);

        if(!ruleset) {
            res.json({
                processing: 'Failed to start: no rule specified'
            });
            return;
        }

        // Log the request. (This is a test so don't log it?)
        const auth = this.getAuth(req);
        console.log({
            ruleset: ruleset.id,
			user: auth.user,
			group: auth.group,
			type: "validation",
			action: "upload",
			version: ruleset.version
        });

        this.config.data.rulesetExists(ruleset).then((exists) => {

            if(exists) {
                // Use the mv() method to place the file somewhere on your server
                file.mv(fileToProcess, err => {
                    if (err)
                        return res.status(500).send(err);

                    this.generateResponse(res, ruleset,
                        this.processFile(ruleset, null, fileToProcess, outputFile, 'Upload test: ' + file.name, next, res, true, () => {

                            fs.unlink(fileToProcess);

                            if (fs.existsSync(outputFile)) {
                                fs.unlink(outputFile);
                            }
                        })
                    );


                });
            } else {
                res.statusMessage = `${ruleset} not found.`;
                res.status(404).send(`${ruleset} not found.`);
            }

        }, (error) => {
            next(error);
        }).catch(next);

    }

    generateResponse(res, ruleset, processFilePromise) {
        processFilePromise.then((runId) => {
            res.json({
                status: "Started",
                ruleset: ruleset,
                runId: runId
            })
        }, (err) => {
            if (err ==="too many tasks") {
                res.status(429).send("Too many tasks are currently in progress");
            } else {
                res.json({
                    status: 'Failed to start: ' + err,
                    ruleset: ruleset,
                    runId: null
                });
            }
        }).catch((e) => {
            res.json({
                status: 'Failed to start: ' + e,
                ruleset: ruleset,
                runId: null
            });
        });
    }

    processFile(ruleset, importConfig, inputFile, outputFile, inputDisplayName, next, res, test, finishedFn, user, group, skipMd5Check) {
        return new Promise((resolve, reject) => {

            if(this.config.validatorConfig.maxConcurrentTasks && this.config.runningJobs.length >= this.config.validatorConfig.maxConcurrentTasks) {
                reject("too many tasks");
                return;
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

            // Called by the server when a SIGTERM is given to the server.
            const terminate = (finishedFn) => {

                let run = this.config.runningJobs.find((element) => {
                    return element.terminate === terminate;
                });

                if(run) {
                    run.finishedFn = finishedFn;
                } else {
                    finishedFn();
                }
            };

            this.config.runningJobs.push({terminate:terminate});

            const timeoutId = setTimeout(runTimeout, this.config.runMaximumDuration * 1000);

            let tempFolder = null;

            let fullLog = '';
            const auth = this.getAuth(req);

            // Called when the process is finished either by exitting or because of an error.
            const finished = () => {

                clearTimeout(timeoutId);

                let index = this.config.runningJobs.findIndex((element) => {
                    return element.terminate === terminate;
                });
                let run = null;

                if(index >= 0) {
                    run = this.config.runningJobs[index];
                    this.config.runningJobs.splice(index, 1);

                } else {
                    //this was removed somewhere else, so just return
                    return Promise.resolve();
                }

                if(overrideFile) {
                    fs.unlink(overrideFile);
                }

                if(finishedFn) {
                    finishedFn();
                }

                if(tempFolder && fs.existsSync(tempFolder)) {
                    rimraf.sync(tempFolder, null, (e) => {
                        console.log('Unable to delete folder: ' + tempFolder + '.  Reason: ' + e);
                    });
                }
        
                this.config.data.cleanupRun(runId, terminationMessage, fullLog)
                    .then(() => {}, () => {}).catch(() => {}).then(() => {

                    if(run && run.finishedFn) {
                        run.finishedFn();
                    }
                })


            };

            proc.on('error', (err) => {

                let message = "unable to start validator: " + err;

                fullLog += message + '\n';

                console.error(message);

                finished();

                reject(err);
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
                            resolve(runId);
                        }

                        log.log = "plutorun";
                        log.runId = runId;
                        log.state = log.state || "running";
                        log.user = auth.user
                        log.group = auth.group

                        console.log(log);

                    } else {

                        console.log({
                            log: "plutorun",
                            runId: runId,
                            state: "running",
                            messageType: "log",
                            message: str,
                            user: auth.user,
                            group: auth.group
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
                        user: auth.user,
                        group: auth.group
                    });
                });

            });

            proc.on('exit', (code) => {

                console.log({
                    log: "plutorun",
                    runId: runId,
                    state: "exit",
                    exitCode: code,
                    user: auth.user,
                    group: auth.group
        });


                finished();

                resolve();
            });



        })
    }

    addToQueue(ruleset, importConfig, inputFile, outputFile, inputDisplayName, next, res, test, finishedFn, user, group, skipMd5Check) {
    
        let conn, ch, runId;

        let channelPromise = amqp.connect(this.config.rabbitMQ).then((connIn) => {
            conn = connIn;
            
            return conn.createChannel();

        }, (err) => {
            let msg = "Error connecting to RabbitMQ: " + err;
            console.log(msg);
            next(msg);
        }).then((ch) => {

            ch.assertQueue(this.queue, {durable: true});
            ch.prefetch(1);

            return ch;            

        }, (err) => {
            let msg = "Error creating channel: " + err
            console.log(msg);
            next(msg);
        })
        
        let runPromise = this.data.createRunRecord(ruleset, user, group);   
        
        Promise.all([channelPromise, runPromise]).then((results) => {
            let ch = results[0];
            let runId = results[1];

            var msg = JSON.stringify({
                ruleset: ruleset,
                importConfig: importConfig,
                test: test,
                skipMd5Check: skipMd5Check,
                user: user,
                group: group,
                runId: runId
            });

            ch.sendToQueue(q, new Buffer(msg), {persistent: true});
        })
        .catch((e) => {
            let msg = "Got exception adding to queue: " + e;
            console.log(msg);
            next(msg);
        });
    }
    

    // Create a unique temporary filename in the temp directory.
    getTempName(config) {
        const dirname = config.tempDir;
        const filename = Util.createGUID();
        return path.resolve(dirname, filename);
    }
}

module.exports = ProcessFileRouter;
