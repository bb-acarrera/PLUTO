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

        if(!ruleset) {
            res.json({
                processing: 'Failed to start: no rule specified'
            });
            return;
        }

        //if(!ruleset.endsWith('.json')) {
        //    ruleset = ruleset + '.json';
        //}

        let overrideFile = null;


        new Promise((resolve) => {



            if(req.body.import) {
                overrideFile = this.getTempName(this.config) + '.json';
                fs.writeFileSync(overrideFile, JSON.stringify({ import: req.body.import }), 'utf-8');
            }

            const options = {
                cwd: path.resolve('.')
            };

            var cmd = 'node validator/validator.js -r ' + ruleset + ' -c "' + this.config.validatorConfigPath + '"';
            cmd += ' -o ' + ruleset;
            if(overrideFile) {
                cmd += ' -v "' + overrideFile + '"';
            }

            console.log('exec cmd: ' + cmd);

            child_process.exec(cmd, options, (error, stdout, stderr) => {

                if(overrideFile) {
                    fs.unlink(overrideFile);
                }

                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });

            res.json({
                processing: 'started ' + req.body.ruleset
            });

            resolve();
        }).catch((e) => {
            res.json({
                processing: 'Failed to start: ' + e
            });
        }).then(() => {
            //do cleanup
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
