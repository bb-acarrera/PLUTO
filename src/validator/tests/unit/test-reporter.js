const proxyquire = require('proxyquire');
const ErrorLogger = require("../../ErrorLogger");

const Reporter = proxyquire("../../reporter", {
	"nodemailer" : {
		createTransport: function(config) {
			return {
				verify: function() {

					return new Promise((resolve, reject) => {
						if(config && config.verify) {
							config.verify(resolve, reject);
						} else {
							resolve();
						}
					});


				},
				sendMail(message) {
					return new Promise((resolve, reject) => {
						if(config && config.sendMail) {
							config.sendMail(message, resolve, reject);
						} else {
							resolve();
						}
					});
				}
			}
		},
		getTestMessageUrl: function(info) {

			if(info && info.getTestMessageUrl) {
				return info.getTestMessageUrl(info);
			}

			return "";
		}

	}

});

QUnit.module("Reporter");

QUnit.test( "sendReport: Successful", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		email: 'test'
	};

	let messageSent = false;

	const smtpConfig = {
		host: 'test',

		sendMail: (message, resolve, reject) => {

			messageSent = true;

			resolve({});
		}
	};

	const config = {
		smtpConfig: smtpConfig,
		configHost: "test"
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(config, logger);

	reporter.sendReport(ruleset, "0", false).then(() => {
		assert.ok(messageSent, "Expected message to be sent");
		done();
	})
});

QUnit.test( "sendReport: no config", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		email: 'test'
	};


	const config = {
		configHost: "test"
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(config, logger);

	reporter.sendReport(ruleset, "0", false).then(() => {
		assert.ok(true, "Expected sneReport to succeed");
		done();
	})
});

QUnit.test( "sendReport: no email", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test'
	};

	let messageSent = false;

	const smtpConfig = {
		host: 'test',

		sendMail: (message, resolve, reject) => {

			messageSent = true;

			resolve({});
		}
	};

	const config = {
		smtpConfig: smtpConfig,
		configHost: "test"
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(config, logger);

	reporter.sendReport(ruleset, "0", false).then(() => {
		assert.ok(messageSent == false, "Expected no message to be sent");
		done();
	})
});

QUnit.test( "sendReport: failed to verify", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		email: 'test'
	};

	let messageSent = false;

	const smtpConfig = {
		host: 'test',

		sendMail: (message, resolve, reject) => {

			messageSent = true;

			resolve({});
		},

		verify: (resolve, reject) => {
			throw "Failed to connect";
		}
	};

	const config = {
		smtpConfig: smtpConfig,
		configHost: "test"
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(config, logger);

	reporter.sendReport(ruleset, "0", false).then(() => {
		assert.ok(messageSent == false, "Expected no message to be sent");

		done();
	})
});

QUnit.test( "sendReport: sendMail failed", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		email: 'test'
	};

	let messageSent = false;

	const smtpConfig = {
		host: 'test',

		sendMail: (message, resolve, reject) => {

			throw "error";
		}
	};

	const config = {
		smtpConfig: smtpConfig,
		configHost: "test"
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(config, logger);

	reporter.sendReport(ruleset, "0", false).then(() => {
		assert.ok(messageSent == false, "Expected no message to be sent");
		done();
	})
});




QUnit.module("");