
const nodemailer = require('nodemailer');

const ErrorHandlerAPI = require("../api/errorHandlerAPI");

class Reporter {
	constructor(validatorConfig, rulesetConfig, errorLogger, rulesLoader) {
		this.validatorConfig = validatorConfig;
		this.rulesetConfig = rulesetConfig;
		this.errorLogger = errorLogger;

		this.reporters = [];
		this.reporterInitPromises = [];

		validatorConfig.reporters.forEach((reporterConfig) => {

			let rulesetReporterConfigs = rulesetConfig.reporters.filter((rulesetReporterConfig) => {
					return reporterConfig.filename === rulesetReporterConfig.filename;
				});

			let rulesetReporterConfig = null;

			if(rulesetReporterConfigs.length > 0) {
				rulesetReporterConfig = rulesetReporterConfigs[0];
			}

			let reporterClass = rulesLoader.reportersMap[reporterConfig.filename];

			if(reporterClass) {
				let reporter = new reporterClass(reporterConfig.config, rulesetReporterConfig.config);
				this.reporters.push(reporter);
				this.reporterInitPromises.push(reporter.initialize());
			}


		});

		this.initialized = new Promise((resolve) => {

			let doneCount = 0;

			this.reporterInitPromises.forEach((promise) => {
				promise.then((reporter) => {

				}, (e) => {
					errorLogger.log(ErrorHandlerAPI.WARNING, this.constructor.name, undefined, e);
				}).catch((e) => {
					errorLogger.log(ErrorHandlerAPI.WARNING, this.constructor.name, undefined, e);
				}).then(() => {
					doneCount += 1;

					if(doneCount == this.reporterInitPromises.length) {
						resolve();
					}

				})
			});


		}).catch((e) => {
			errorLogger.log(ErrorHandlerAPI.WARNING, this.constructor.name, undefined, e);

		})

	}

	sendReport(ruleset, runId, aborted) {

		const message = generateMessage.call(this, ruleset, runId, aborted);

		return new Promise((resolve) => {

			let doneCount = 0;

			function done() {
				doneCount += 1;

				if(doneCount == this.reporterInitPromises.length) {
					resolve();
				}
			}

			this.reporterInitPromises.forEach((promise) => {
				promise.then((reporter) => {

					if(reporter) {
						reporter.sendReport(message.subject, message.body).then(() => {

						}, (e) => {
							console.log('Error sending report: ' + e);
						}).catch((e) => {
							console.log('Exception sending report: ' + e);
						}).then(() => {
							done.call(this);
						});
					} else {
						done.call(this);
					}

				}, () => {
					done.call(this);
				}).catch(() => {
					done.call(this);
				})
			});



		});


	}


}


function generateMessage(ruleset, runId, aborted) {


	let subject, html;

	const errors = this.errorLogger.getCount(ErrorHandlerAPI.ERROR);
	const warnings = this.errorLogger.getCount(ErrorHandlerAPI.WARNING);

	subject = "PLTUO ";
	if(aborted) {
		subject += "Failed ";
	} else {
		subject += "Completed ";
	}

	subject += ruleset.ruleset_id;

	if(errors > 0) {
		subject += " with errors"
	} else if(warnings > 0) {
		subject += " with warnings"
	}

	let protocol = this.validatorConfig.configHostProtocol || 'http';

	let link = `${protocol}://${this.validatorConfig.configHost}/#/run/${runId}`;

	html = "";

	html += `<p>${errors} errors</p>`;
	html += `<p>${warnings} warnings</p>`;
	html += `<p>Review at <a href="${link}">${link}</a></p>`;

	return  {
		subject: subject,
		body: html
	};




}

module.exports = Reporter;