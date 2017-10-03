const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');

const child_process = require('child_process');
const fs = require('fs-extra');
const path = require("path");



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
    }

    post(req, res, next) {
        // Note that in general the server and validator can have different root directories.
        // The server's root directory points to the client code while the validator's root
        // directory points to rulesets, rule plugins and such. It can be configured such
        // that these two root directories are the same.

        console.log('got processFile request');

        let ruleset = req.body.ruleset;
        let inputFile = req.body.input;
        let outputFile = req.body.output;
        let importConfig = req.body.import;

        if(!ruleset) {
            res.json({
                processing: 'Failed to start: no rule specified'
            });
            return;
        }

        this.generateResponse(res, ruleset, this.processFile(ruleset, importConfig, inputFile, outputFile, next, res));
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

        // Use the mv() method to place the file somewhere on your server
        file.mv(fileToProcess, err => {
            if (err)
                return res.status(500).send(err);

            this.generateResponse(res, ruleset,
                this.processFile(ruleset, null, fileToProcess, outputFile, next, res, () => {
                    fs.unlink(outputFile);
                })
            );

            fs.unlink(fileToProcess);
        });
    }

    generateResponse(res, ruleset, processFilePromise) {
        processFilePromise.then((runId) => {
            res.json({
                status: "Started",
                ruleset: ruleset,
                runId: runId
            })
        }, (err) => {
            res.json({
                status: 'Failed to start: ' + err,
                ruleset: ruleset,
                runId: null
            });
        }).catch((e) => {
            res.json({
                status: 'Failed to start: ' + e,
                ruleset: ruleset,
                runId: null
            });
        });
    }

    processFile(ruleset, importConfig, inputFile, outputFile, next, res, finishedFn) {
        return new Promise((resolve, reject) => {

            var execCmd = 'node validator/startValidator.js -r ' + ruleset + ' -c "' + this.config.validatorConfigPath + '"';
            var spawnCmd = 'node';
            var spawnArgs = ['validator/startValidator.js', '-r', ruleset, '-c', this.config.validatorConfigPath];
            let overrideFile = null;

            if (importConfig) {
                overrideFile = this.getTempName(this.config) + '.json';
                fs.writeFileSync(overrideFile, JSON.stringify({import: importConfig}), 'utf-8');
                execCmd += ' -v "' + overrideFile + '"';
                spawnArgs.push('-v');
                spawnArgs.push(overrideFile);
            } else {
                execCmd += ' -i "' + inputFile + '" -o "' + outputFile + '"';
                spawnArgs.push('-i');
                spawnArgs.push(inputFile);
                spawnArgs.push('-o');
                spawnArgs.push(outputFile);
            }

            const options = {
                cwd: path.resolve('.')
            };

            console.log('exec cmd: ' + execCmd);


            let proc = child_process.spawn(spawnCmd, spawnArgs, options);

            proc.on('error', (err) => {
                console.log("spawn error: " + err);

                if(overrideFile) {
                    fs.unlink(overrideFile);
                }

                reject(err);
            });

            proc.stdout.on('data', (data) => {
                let str = data.toString();
                console.log('stdout: ' + str);

                if(str.startsWith('runId:')) {
                    resolve(str.substr(6).trim());
                }
            });

            proc.stderr.on('data', (data) => {
                console.log('stderr: ' + data.toString());
            });

            proc.on('exit', (code) => {
                console.log('child process exited with code ' + code.toString());

                if(overrideFile) {
                    fs.unlink(overrideFile);
                }

                if(finishedFn) {
                    finishedFn();
                }

                resolve();
            });

        })
    }



    // Create a unique temporary filename in the temp directory.
    getTempName(config) {
        const dirname = config.tempDir;
        const filename = Util.createGUID();
        return path.resolve(dirname, filename);
    }
}

module.exports = ProcessFileRouter;
