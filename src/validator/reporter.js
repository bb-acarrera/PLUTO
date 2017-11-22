
const nodemailer = require('nodemailer');

class Reporter {
	constructor(config, errorLogger) {
		this.config = config;
		this.smtpConfig = config.smtpConfig;

		this.transporter = nodemailer.createTransport(this.smtpConfig);
		this.verifing = this.transporter.verify().then((success) => {

		}).catch((error) => {
			console.log('Unable to connect to smtp server: ' + error);
			errorLogger.warning('Unable to connect to smtp server: ' + error);
		})
	}

	sendReport() {
		this.verifing.then(() => {
			console.log('message sent');
		})
	}
}

module.exports = Reporter;