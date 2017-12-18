const proxyquire = require('proxyquire');
const ErrorLogger = require("../../ErrorLogger");

const SmtpReporter = proxyquire("../../../rules/smtpReporter", {
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

QUnit.module("SmtpReporter");

QUnit.test( "sendReport: Successful", function(assert){

	const done = assert.async();

	const rulesetConfig = {
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


	const validatorConfig = {
		smtpConfig: smtpConfig
	};

	const reporter = new SmtpReporter(validatorConfig, rulesetConfig);

	reporter.initialize().then(() => {
		reporter.sendReport('subject', 'body').then(() => {
			assert.ok(messageSent, "Expected message to be sent");
			done();
		})
	}, (e) => {
		throw e;
	}).catch((e) => {
		assert.ok(false, "Error: " + e);
		done();
	});


});

QUnit.test( "sendReport: no validator config", function(assert){

	const done = assert.async();

	const rulesetConfig = {
		email: 'test'
	};

	let messageSent = false;

	const validatorConfig = {};

	const reporter = new SmtpReporter(validatorConfig, rulesetConfig);

	reporter.initialize().then(() => {
		reporter.sendReport('subject', 'body').then(() => {
			assert.ok(true, "Expected sendReport to succeed");
			done();
		})
	}, (e) => {
		throw e;
	}).catch((e) => {
		assert.ok(false, "Error: " + e);
		done();
	});

});


QUnit.test( "sendReport: no email", function(assert){

	const done = assert.async();

	const rulesetConfig = {	};

	let messageSent = false;

	const smtpConfig = {
		host: 'test',

		sendMail: (message, resolve, reject) => {

			messageSent = true;

			resolve({});
		}
	};

	const validatorConfig = {
		smtpConfig: smtpConfig
	};

	const reporter = new SmtpReporter(validatorConfig, rulesetConfig);

	reporter.initialize().then(() => {
		reporter.sendReport('subject', 'body').then(() => {
			assert.ok(messageSent == false, "Expected no message to be sent");
			done();
		})
	}, (e) => {
		throw e;
	}).catch((e) => {
		assert.ok(false, "Error: " + e);
		done();
	});
});

QUnit.test( "sendReport: failed to verify", function(assert){

	const done = assert.async();

	const rulesetConfig = {
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


	const validatorConfig = {
		smtpConfig: smtpConfig
	};

	const reporter = new SmtpReporter(validatorConfig, rulesetConfig);

	reporter.initialize().then(() => {
		assert.ok(false, "Expected initialized to reject");
		done();
	}, (e) => {
		assert.ok(true, "Expected initialized to reject");
		done();
	}).catch((e) => {
		assert.ok(false, "Error: " + e);
		done();
	});
});

QUnit.test( "sendReport: sendMail failed", function(assert){
	const done = assert.async();

	const rulesetConfig = {
		email: 'test'
	};

	let messageSent = false;

	const smtpConfig = {
		host: 'test',

		sendMail: (message, resolve, reject) => {

			throw "error";
		}
	};


	const validatorConfig = {
		smtpConfig: smtpConfig
	};

	const reporter = new SmtpReporter(validatorConfig, rulesetConfig);

	reporter.initialize().then(() => {
		reporter.sendReport('subject', 'body').then(() => {
			assert.ok(messageSent == false, "Expected no message to be sent");
			done();
		})
	}, (e) => {
		throw e;
	}).catch((e) => {
		assert.ok(false, "Error: " + e);
		done();
	});
});




QUnit.module("");