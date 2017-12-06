const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');


class LogsRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res, next) {
		 let id = req.query.id || req.params.id;
		 let page = parseInt(req.query.page, 10);
		 let size = parseInt(req.query.size, 10);

		if(isNaN(page)) {
			page = 1;
		}

		if(isNaN(size)) {
			size = 0;
		}

		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.
		this.config.data.getLog(id, page, size, req.query.ruleid, req.query.type).then((log) => {
			if (!log) {
				res.status(404).send(`Unable to retrieve the log '${id}'.`);
				return;
			}

			var relationshipLogReports = [];
			var includedReports = [];
			for (var i = 0; i < log.logs.length; i++) {
				const report = log.logs[i];
				const reportID = id + '-' + report.index;	// Reports don't have their own ID. Should they have one? (log name + timestamp + level + ???).
				const reportType = report.type;
				const reportWhen = report.when;
				const reportProblemFile = report.problemFile;
				const reportDescription = report.description;
				const ruleID = report.ruleID;
				relationshipLogReports.push({type: 'report', id: reportID});
				includedReports.push(
					{
						id: reportID,
						type: 'log',
            attributes: {
              "log-type": reportType,
              when: reportWhen,
              "problem-file": reportProblemFile,
              "rule-id": ruleID,
              description: reportDescription
            }
					});
			}

			res.json({
				data: includedReports,
				meta: { rowCount: log.rowCount, totalPages: log.pageCount, ruleState: log.ruleStates}
			});
		}, next)
			.catch(next);

	}
}

module.exports = LogsRouter;
