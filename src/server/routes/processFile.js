const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');

const child_process = require('child_process');
const fs = require('fs-extra');
const path = require("path");

const TreeKill = require('tree-kill');
const rimraf = require('rimraf');

const ErrorHandlerAPI = require("../../api/errorHandlerAPI");
const ErrorLogger = require("../../validator/ErrorLogger");

//get the root PLUTO folder from this file
const rootFolder = path.resolve(__dirname, '../../');

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

            if(test) {
                outputFile = this.getTempName(this.config);

                finishHandler = () => {

                    if (fs.existsSync(outputFile)) {
                        fs.unlink(outputFile);
                    }
                }
            }

            this.generateResponse(res, ruleset,
                this.processFile(ruleset, importConfig, inputFile, outputFile, null,
                    next, res, test, finishHandler, auth.user, auth.group, skipMd5Check));
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

            function runTimeout() {
                console.log(`Child process for took too long. Terminating.`);
                terminationMessage = `Run took too long and was terminated by the server.`;
                TreeKill(proc.pid);
            }

            const terminate = (finishedFn) => {

                let run = this.config.runningJobs.find((element) => {
                    return element.terminate === terminate;
                });

                if(run) {
                    run.finishedFn = finishedFn;
                }

                terminationMessage = `Server is shutting down. Terminating run.`;
                TreeKill(proc.pid);

            };

            if(!this.config.validatorConfig.maxConcurrentTasks || this.config.runningJobs.length < this.config.validatorConfig.maxConcurrentTasks) {
                this.config.runningJobs.push({terminate:terminate});
            } else {
                reject("too many tasks");
            }


            const timeoutId = setTimeout(runTimeout, this.config.runMaximumDuration * 1000);
            let runId = null;
            let tempFolder = null;

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

                this.cleanupRun(runId, tempFolder, terminationMessage)
                    .then(() => {}, () => {}).catch(() => {}).then(() => {

                    if(run && run.finishedFn) {
                        run.finishedFn();
                    }
                })


            };

            proc.on('error', (err) => {
                console.error("unable to start validator: " + err);

                finished();

                reject(err);
            });

            proc.stdout.on('data', (data) => {
                let str = data.toString();
                let log = null;

                try {
                    log = JSON.parse(str);
                } catch(e) {

                }

                if(log) {
                    if(log.state && log.state === "start") {
                        runId = log.runId;
                        tempFolder = log.tempFolder;
                        resolve(runId);
                    }

                    log.log = "plutrun";
                    log.runId = runId;

                    console.log(log);

                } else {

                    splitConsoleOutput(str).forEach((str) => {

                        console.log({
                            log: "plutorun",
                            runId: runId,
                            state: "running",
                            messageType: "log",
                            message: str
                        });
                    });
                }
            });

            proc.stderr.on('data', (data) => {

                splitConsoleOutput(data.toString()).forEach((str) => {
                    console.log({
                        log: "plutorun",
                        runId: runId,
                        state: "running",
                        messageType: "error",
                        message: str
                    });
                });

            });

            proc.on('exit', (code) => {

                console.log({
                    log: "plutorun",
                    runId: runId,
                    state: "exit",
                    exitCode: code
                });


                finished();

                resolve();
            });



        })
    }

    cleanupRun(runId, tempFolder, terminationMsg) {

        if(tempFolder && fs.existsSync(tempFolder)) {
            rimraf.sync(tempFolder, null, (e) => {
                console.log('Unable to delete folder: ' + tempFolder + '.  Reason: ' + e);
            });
        }

        return new Promise((resolve) => {
            if(runId) {
                this.config.data.getRun(runId).then((runInfo) => {

                        if (!runInfo || !runInfo.isrunning)
                        {
                            resolve();
                            return;
                        }

                        //this shouldn't exist, but since it does let's clean it up
                        const logger = new ErrorLogger();

                        if(!terminationMsg) {
                            terminationMsg = `Run stopped without cleaning up. Server has marked this as finished.`;
                        }

                        logger.log(ErrorHandlerAPI.ERROR, this.constructor.name, undefined,
                            terminationMsg);

                        console.log({
                            log: "plutorun",
                            runId: runId,
                            state: "post exit",
                            messageType: "error",
                            message: terminationMsg
                        });

                        this.config.data.saveRunRecord(runId, logger.getLog(),
                            null, null, null, logger.getCounts(),
                            false, null, null, true)
                            .then(() => { //no-op
                            }, (error) => console.log('error cleaning up bad run: ' + error))
                            .catch((e) => console.log('Exception cleaning up bad run: ' + e))
                            .then(()=> {
                                resolve();
                            })

                    }, (error) => {
                        console.log(error);
                        resolve();
                    })
                    .catch((error) => {
                        console.log(error);
                        resolve();
                    });
            } else {
                resolve();
            }
        });

    }

    // Create a unique temporary filename in the temp directory.
    getTempName(config) {
        const dirname = config.tempDir;
        const filename = Util.createGUID();
        return path.resolve(dirname, filename);
    }
}

function splitConsoleOutput(str) {

    let arr = str.split(/[\r\n]+/);

    //now, join the strings back up if there are a couple of spaces or a tab in the front, which likely indicates an
    // exception or other joining

    let outArr = [];
    let joinedStr = "";

    arr.forEach((str) => {

        if(str.trim().length > 0) {
            if(str.startsWith('  ') || str.startsWith('\t')) {
                joinedStr += str + '\n';
            } else {
                if(joinedStr.length > 0) {
                    outArr.push(joinedStr);
                }

                outArr.push(str);

                joinedStr = "";

            }
        }
    });

    return outArr;
}

module.exports = ProcessFileRouter;
