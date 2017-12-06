
const nodemailer = require('nodemailer');

const ErrorHandlerAPI = require("../api/errorHandlerAPI");

class Reporter {
	constructor(config, errorLogger) {
		this.config = config;
		this.smtpConfig = config.smtpConfig;
		this.errorLogger = errorLogger;

		if(this.smtpConfig && this.smtpConfig.host) {
			this.transporter = nodemailer.createTransport(this.smtpConfig);

			this.reporterOk = true;
			this.reporter = this.transporter.verify().then((success) => {
				this.reporterOk = true;
			}, (error) => {
				throw error;
			}).catch((error) => {
				console.log('Unable to connect to smtp server: ' + error);
				errorLogger.log(ErrorHandlerAPI.WARNING, this.constructor.name, undefined, 'Unable to connect to smtp server: ' + error);
				this.reporterOk = false;
			});
		}

	}

	sendReport(ruleset, runId, aborted) {

		return new Promise((resolve) => {
			if(this.reporter && this.reporterOk && ruleset.email) {
				this.reporter.then(() => {
					if(this.reporterOk) {
						sendEmail.call(this, ruleset, runId, aborted).then(() => {
							resolve();
						}, () => {
							resolve();
						}).catch(() => {
							resolve();
						});
					} else {
						resolve();
					}

				}, () => {
					resolve();
				}).catch(() => {
					resolve();
				})
			} else {
				resolve();
			}
		});


	}


}

function sendEmail(ruleset, runId, aborted) {

	return new Promise((resolve) => {
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

		let protocol = this.config.configHostProtocol || 'http';

		let link = `${protocol}://${this.config.configHost}/#/run/${runId}`;

		html = "";

		html += `<p>${errors} errors</p>`;
		html += `<p>${warnings} warnings</p>`;
		html += `<p>Review at <a href="${link}">${link}</a></p>`;

		var message = {
			from: this.config.emailFrom,
			to: ruleset.email,
			subject: subject,
			html: html
		};

		this.transporter.sendMail(message).then((info) => {
			if(this.smtpConfig.host == 'smtp.ethereal.email') {
				console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
			}

		}, (error) => {
			throw error;
		}).catch((error) => {
			console.log('Error sending report email: ' + error);
		}).then(() => {
			resolve();
		})
	});


}

module.exports = Reporter;