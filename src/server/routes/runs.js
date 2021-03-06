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

        if(req.params.id  || req.query.id) {
            let id;
            if(req.params.id) {
                id = req.params.id;
            } else if(req.query.id) {
                id = req.query.id;
            }

            this.config.data.getRun(id).then((runInfo) => {
                if (!runInfo)
                {
                    res.status(404).send(`Unable to retrieve the run '${id}'.`);
                    return;
                }

                res.json({
                    data:  {
                        id: id,
                        type: 'run',
                        attributes: runInfo
                    }
                });
            }, (error) => {
                next(error);
            })
                .catch(next);

        } else {

            let page = parseInt(req.query.page, 10);
            let size = parseInt(req.query.perPage, 10);
            let rulesetFilter = req.query.rulesetFilter;
            let filenameFilter = req.query.filenameFilter;
            let showErrors = JSON.parse(req.query.errorFilter || true);
            let showWarnings = JSON.parse(req.query.warningsFilter || true);
            let showNone = JSON.parse(req.query.noneFilter || true);
            let dateFilter = null;
            let showDropped = JSON.parse(req.query.droppedFilter || true);
            let showPassed = JSON.parse(req.query.passedFilter || true);
            let showFailed = JSON.parse(req.query.failedFilter || true);
            let showValidOnly = JSON.parse(req.query.failedFilter || false);

            if(req.query.dateFilter && req.query.dateFilter.length > 0) {
                let time = Date.parse(req.query.dateFilter);
                if(!isNaN(time)) {
                    dateFilter = new Date(time);
                }
            }



            if(isNaN(page)) {
                page = 1;
            }

            if(isNaN(size)) {
                size = 0;
            }

            this.config.data.getRuns(page, size, {
                rulesetFilter: rulesetFilter,
                filenameFilter: filenameFilter,
                showErrors: showErrors,
                showWarnings: showWarnings,
                showNone: showNone,
                dateFilter: dateFilter,
                groupFilter: req.query.groupFilter,
                showDropped: showDropped,
                showPassed: showPassed,
                showFailed: showFailed,
                sourceFileFilter: req.query.sourceFileFilter,
                sourceFilter: req.query.sourceFilter,
                rulesetIdListFilter: req.query.rulesetIdListFilter,
                showValidOnly: showValidOnly,
                idFilter: req.query.idFilter
            }).then((result) => {
                    var data = [];

                    result.runs.forEach(runInfo => {
                        var run = {
                            id: runInfo.id,
                            type: 'run',
                            attributes: runInfo
                        };
                        data.push(run);
                    });



                    res.json({
                        data: data,
                        meta: { rowCount: result.rowCount, totalPages: result.pageCount}
                    });
                }, next)
                .catch(next);

        }


    }
}

module.exports = RunsRouter;
