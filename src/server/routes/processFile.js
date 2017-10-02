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

        this.processFile(ruleset, importConfig, inputFile, outputFile, next, res);
    }

    processFile(ruleset, importConfig, inputFile, outputFile, next, res, finishedFn) {
        new Promise((resolve) => {

            var cmd = 'node validator/startValidator.js -r ' + ruleset + ' -c "' + this.config.validatorConfigPath + '"';
            let overrideFile = null;

            if (importConfig) {
                overrideFile = this.getTempName(this.config) + '.json';
                fs.writeFileSync(overrideFile, JSON.stringify({import: importConfig}), 'utf-8');
                cmd += ' -v "' + overrideFile + '"';
            } else {
                cmd += ' -i "' + inputFile + '" -o "' + outputFile + '"';
            }

            const options = {
                cwd: path.resolve('.')
            };

            console.log('exec cmd: ' + cmd);

            child_process.exec(cmd, options, (error, stdout, stderr) => {

                if (overrideFile) {
                    fs.unlink(overrideFile);
                }

                if (error) {
                    console.error(`exec error: ${error}`);
                    next(error);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                if(finishedFn) {
                    finishedFn();
                }
            });

            res.json({
                processing: 'started ' + ruleset
            });

            resolve();
        }).catch((e) => {
            res.json({
                processing: 'Failed to start: ' + e
            });
        }).then(() => {

        });
    }

    processUpload(req, res, next) {
        if (!req.files)
            return res.status(400).send('No files were uploaded.');

        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
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

            this.processFile(ruleset, null, fileToProcess, outputFile, next, res, () => {
                fs.unlink(outputFile);
            });

            fs.unlink(fileToProcess);


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
