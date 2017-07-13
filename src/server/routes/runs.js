const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');

class RunsRouter extends BaseRouter {
    constructor(config) {
        super(config);
    }

    get(req, res, next) {
        // Note that in general the server and validator can have different root directories.
        // The server's root directory points to the client code while the validator's root
        // directory points to rulesets, rule plugins and such. It can be configured such
        // that these two root directories are the same.

        if(req.params.id) {
            const runInfo = this.config.data.getRun(req.params.id);
            if (!runInfo)
                return next(new Error(`Unable to retrieve the run '${req.params.id}'.`));


            res.json({
                data:  {
                    id: req.params.id,
                    type: 'run',
                    attributes: runInfo
                }
            });
        } else {
            const runs = this.config.data.getRuns();
            var data = [];

            runs.forEach(runId => {
                const runInfo = this.config.data.getRun(runId);
                //var run = Object.assign({id: runId}, runInfo);
                var run = {
                    id: runId,
                    type: 'run',
                    attributes: runInfo
                };
                data.push(run);
            });

            res.json({
                data: data
            });
        }


    }
}

module.exports = RunsRouter;
