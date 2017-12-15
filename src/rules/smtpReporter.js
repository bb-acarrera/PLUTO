
const nodemailer = require('nodemailer');

const ErrorHandlerAPI = require("../api/errorHandlerAPI");
const ReporterAPI = require("../api/reporterAPI");

class SmtpReporter extends ReporterAPI {
	constructor(validatorConfig, rulesetConfig) {
		super(validatorConfig, rulesetConfig);
		this.smtpConfig = this.validatorConfig.smtpConfig;
	}

	initialize() {
		return new Promise((resolve, reject) => {
			if(this.smtpConfig && this.smtpConfig.host && this.rulesetConfig && this.rulesetConfig.email) {
				this.transporter = nodemailer.createTransport(this.smtpConfig);

				this.transporter.verify().then((success) => {
					resolve(this);
				}, (error) => {
					throw error;
				}).catch((error) => {
					console.log('Unable to connect to smtp server: ' + error);
					reject('Unable to connect to smtp server: ' + error);
				});
			} else {
				resolve(this);
			}
		});

	}

	sendReport(subject, body) {

		return new Promise((resolve) => {

			if(!this.smtpConfig || !this.rulesetConfig.email || this.rulesetConfig.email.length == 0) {
				resolve();
				return;
			}

			var message = {
				from: this.validatorConfig.emailFrom,
				to: this.rulesetConfig.email,
				subject: subject,
				html: body
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

	/**
	 * The list of config properties.  Used by the UI for display.
	 * @returns {Array}
	 * @constructor
	 */
	static get ConfigProperties() {
		return [
			{
				name: 'email',
				label: 'Email',
				type: 'string',
				tooltip: 'The email to send validator results to for this file.'
			}
		];
	}

	/**
	 * The default values for configuration.
	 * @returns {{}}
	 * @constructor
	 */
	static get ConfigDefaults() {
		return {};
	}

}

module.exports = SmtpReporter;