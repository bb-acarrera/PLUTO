const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');

class RunsRouter extends BaseRouter {
    constructor(config) {
        super(config);
    }

    get(req, res) {
        // Note that in general the server and validator can have different root directories.
        // The server's root directory points to the client code while the validator's root
        // directory points to rulesets, rule plugins and such. It can be configured such
        // that these two root directories are the same.

        if(req.params.id) {
            this.config.data.getRun(req.params.id).then((runInfo) => {
                if (!runInfo)
                    throw new Error(`Unable to retrieve the run '${req.params.id}'.`);

                res.json({
                    data:  {
                        id: req.params.id,
                        type: 'run',
                        attributes: runInfo
                    }
                });
            });

        } else {
            this.config.data.getRuns().then((runs) => {
                var data = [];

                runs.forEach(runInfo => {
                    var run = {
                        id: runInfo.id,
                        type: 'run',
                        attributes: runInfo
                    };
                    data.push(run);
                });

                res.json({
                    data: data
                });
            });

        }


    }
}

module.exports = RunsRouter;
