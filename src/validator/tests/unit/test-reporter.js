const proxyquire = require('proxyquire');
const ErrorLogger = require("../../ErrorLogger");

const Reporter = require("../../reporter");
const ReporterAPI = require("../../../api/reporterAPI");

const ErrorHandlerAPI = require("../../../api/errorHandlerAPI");

class TestReporter extends ReporterAPI {
	constructor(validatorConfig, rulesetConfig) {
		super(validatorConfig, rulesetConfig);
	}

	initialize() {
		return new Promise((resolve, reject) => {

			if(this.validatorConfig.initialize) {
				this.validatorConfig.initialize(this, resolve, reject);
			} else if(this.rulesetConfig.initialize) {
				this.rulesetConfig.initialize(this, resolve, reject);
			} else {
				resolve(this);
			}

		});
	}

	sendReport(subject, body) {

		return new Promise((resolve, reject) => {

			if(this.validatorConfig.sendReport) {
				this.validatorConfig.sendReport(subject, body, resolve, reject);
			} else if(this.rulesetConfig.sendReport) {
				this.rulesetConfig.sendReport(subject, body, resolve, reject);
			} else {
				resolve();
			}
		});
	}
}

class TestReporter2 extends TestReporter {
	constructor(validatorConfig, rulesetConfig) {
		super(validatorConfig, rulesetConfig);
	}
}

const RulesLoader = {
	reportersMap: {
		'TestReporter': TestReporter,
		'TestReporter2': TestReporter2
	}
};

QUnit.module("Reporter");

QUnit.test( "sendReport: Successful", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});


});


QUnit.test( "sendReport: no config", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
		]
	};

	const validatorCfg = {
		configHost: "test",
		reporters: [
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(true, "Expected to complete");

			done();
		})
	});


});

QUnit.test( "sendReport: one initialize reject", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;

	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					initialize: function(testReporter, resolve, reject) {

						reject('rejected');
					},
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(true, "Expected to complete");
			assert.ok(!messageSent, "Expect message sent not be called");
			assert.equal(logger.reports.length, 1, "Expected one log entry");

			done();
		})
	});


});

QUnit.test( "sendReport: one initialize throw", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;

	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					initialize: function(testReporter, resolve, reject) {

						throw 'exception';
					},
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(true, "Expected to complete");
			assert.ok(!messageSent, "Expect message sent not be called");
			assert.equal(logger.reports.length, 1, "Expected one log entry");

			done();
		})
	});


});

QUnit.test( "sendReport: one sendReport reject", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};


	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						reject('rejected');
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(true, "Expected to complete");
			assert.equal(logger.reports.length, 0, "Expected no log entry");

			done();
		})
	});


});

QUnit.test( "sendReport: one sendReport throw", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};


	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						throw 'Exception';
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(true, "Expected to complete");
			assert.equal(logger.reports.length, 0, "Expected no log entry");

			done();
		})
	});


});

QUnit.test( "sendReport: Two Successful", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			},
			{
				filename: 'TestReporter2',
				config: {
					test: 'test2'
				}
			}
		]
	};

	let messageSentCount = 0;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSentCount += 1;
						resolve();
					}
				}
			},
			{
				filename: 'TestReporter2',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSentCount += 1;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.equal(messageSentCount, 2, "Expected 2 messages to be sent");

			done();

		})
	});


});

QUnit.test( "sendReport: One initialize reject, one Successful", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			},
			{
				filename: 'TestReporter2',
				config: {
					test: 'test2'
				}
			}
		]
	};

	let messageSentCount = 0;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test',
					initialize: function(testReporter, resolve, reject) {

						reject('rejected');
					},
					sendReport: function(subject, body, resolve, reject) {

						messageSentCount += 1;
						resolve();
					}
				}
			},
			{
				filename: 'TestReporter2',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSentCount += 1;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.equal(messageSentCount, 1, "Expected 1 message to be sent");
			assert.equal(logger.reports.length, 1, "Expected one log entry");
			done();

		})
	});


});


QUnit.test( "sendReport: send on abort w/ abort", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'failed',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", true).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});


});

QUnit.test( "sendReport: send on abort wo/ abort", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'failed',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(!messageSent, "Expected message not to be sent");

			done();

		})
	});


});

QUnit.test( "sendReport: send on warned wo/ warning or dropped", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'warned',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(!messageSent, "Expected message not to be sent");

			done();

		})
	});


});

QUnit.test( "sendReport: send on warned w/ warning", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'warned',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();

	logger.log(ErrorHandlerAPI.WARNING, "", 0, "Warning Description");

	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});


});

QUnit.test( "sendReport: send on warned w/ dropped", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'warned',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();

	logger.log(ErrorHandlerAPI.DROPPED, "", 0, "Dropped Description");

	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});


});

QUnit.test( "sendReport: send on warned w/ warning & dropped", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'warned',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();

	logger.log(ErrorHandlerAPI.WARNING, "", 0, "Warning Description");
	logger.log(ErrorHandlerAPI.DROPPED, "", 0, "Dropped Description");

	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});

});

QUnit.test( "sendReport: send on warned w/ abort", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'warned',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();

	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", true).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});

});

QUnit.test( "sendReport: send on always", function(assert){

	const done = assert.async();

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		reporters: [
			{
				filename: 'TestReporter',
				config: {
					test: 'test'
				}
			}
		]
	};

	let messageSent = false;



	const validatorCfg = {
		configHost: "test",
		reporters: [
			{
				filename: 'TestReporter',
				sendOn: 'always',
				config: {
					test: 'test',
					sendReport: function(subject, body, resolve, reject) {

						messageSent = true;
						resolve();
					}
				}
			}
		]
	};

	const logger = new ErrorLogger();
	const reporter = new Reporter(validatorCfg, ruleset, logger, RulesLoader);

	reporter.initialized.then(() => {}, () =>{}).catch(() => {}).then(() => {
		reporter.sendReport(ruleset, "0", false).then(() => {
			assert.ok(messageSent, "Expected message to be sent");

			done();

		})
	});

});

QUnit.module("");