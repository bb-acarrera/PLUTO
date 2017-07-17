const BaseRouter = require('./baseRouter');
const Util = require('../../common/Util');


class LogsRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res) {
		// Note that in general the server and validator can have different root directories.
		// The server's root directory points to the client code while the validator's root
		// directory points to rulesets, rule plugins and such. It can be configured such
		// that these two root directories are the same.
		this.config.data.getLog(req.params.id).then((log) => {
			if (!log) {
				throw new Error(`Unable to retrieve the log '${req.params.id}'.`);
			}


			var relationshipLogReports = [];
			var includedReports = [];
			for (var i = 0; i < log.length; i++) {
				const report = log[i];
				const reportID = req.params.id + i;	// Reports don't have their own ID. Should they have one? (log name + timestamp + level + ???).
				const reportType = report.type;
				const reportWhen = report.when;
				const reportProblemFile = report.problemFile;
				const reportDescription = report.description;
				const ruleID = report.ruleID;
				relationshipLogReports.push({type: 'report', id: reportID});
				includedReports.push(
					{
						type: 'report', id: reportID,
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
				data: {
					type: "log",
					id: req.params.id,	// The filename is used for the id.
					// attributes: {
					// 	name: ruleset.Name		// The ruleset's name is used here. This will be displayed in the UI.
					// },
					relationships: {
						reports: {
							data: relationshipLogReports
						}
					}
				},
				included: includedReports
			});
		});

	}
}

module.exports = LogsRouter;
