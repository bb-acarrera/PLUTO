const proxyquire = require('proxyquire');

const DataDb = proxyquire("../../../common/dataDb", {
	"./db" : function(config) {
		return {
			end: function() {},
			query: function(text, values, callback) {
				if(config && config.query) {
					return config.query(text, values, callback);
				}

				if(callback) {
					throw "No query handler";
				}

				return new Promise((resolve, reject) => {
					reject('no query handler');
				})


			}
		}
	}
});
const RuleLoader = require('../../../common/ruleLoader');

const ruleLoader = new RuleLoader();

QUnit.module("DataDb - Ruleset");

QUnit.test( "saveRuleSet: Successful", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: null,
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the update call
				assert.equal(values[2], 1, "Version should be 1");

				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 1
							}
						]
					})
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.saveRuleSet(ruleset).then((outRuleset) => {
		assert.equal(outRuleset.filename, ruleset.filename, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRuleSet: Successful same group", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the update call
				assert.equal(values[2], 1, "Version should be 1");

				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 1
							}
						]
					})
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.saveRuleSet(ruleset, 'user', 'some group').then((outRuleset) => {
		assert.equal(outRuleset.filename, ruleset.filename, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRuleSet: Wrong group", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the update call
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 1
							}
						]
					})
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.saveRuleSet(ruleset, 'user', 'other group', false).then((outRuleset) => {
		assert.ok(false, "Expected save to fail");
		done();
	}, (e) => {
		assert.ok(true, 'Expected rejection');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRuleSet: admin and other group", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the update call
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 1
							}
						]
					})
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.saveRuleSet(ruleset, 'user', 'other group', true).then((outRuleset) => {
		assert.ok(true, "Expected save to succeed");
		done();
	}, (e) => {
		assert.ok(false, 'Expected no rejection');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRuleSet: Wrong version", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 1,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the update call
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 1
							}
						]
					})
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.saveRuleSet(ruleset, 'user', 'some group', false).then((outRuleset) => {
		assert.ok(false, "Expected save to fail");
		done();
	}, (e) => {
		assert.ok(true, 'Expected rejection');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRuleSet: Successful same name as deleted", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: true
							}
						]
					})
				});

			} else {
				//the update call
				assert.equal(values[2], 1, "Version should be 1");

				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 1
							}
						]
					})
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.saveRuleSet(ruleset, 'user', 'other group').then((outRuleset) => {
		assert.equal(outRuleset.filename, ruleset.filename, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRuleSet: Successful", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: null,
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the delete call
				return new Promise((resolve) => {
					resolve();
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRuleSet(ruleset).then((filename) => {
		assert.equal(filename, ruleset.filename, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRuleSet: Successful same group", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the delete call
				return new Promise((resolve) => {
					resolve();
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRuleSet(ruleset, 'user', 'some group').then((filename) => {
		assert.equal(filename, ruleset.filename, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRuleSet: Wrong version", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 1,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the delete call
				return new Promise((resolve) => {
					resolve();
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRuleSet(ruleset).then((filename) => {
		assert.ok(false, "Expected delete to fail");
		done();
	}, (e) => {
		assert.ok(true, 'Expected rejection');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRuleSet: Wrong group", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 1,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the delete call
				return new Promise((resolve) => {
					resolve();
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRuleSet(ruleset, 'user', 'other group').then((filename) => {
		assert.ok(false, "Expected delete to fail");
		done();
	}, (e) => {
		assert.ok(true, 'Expected rejection');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRuleSet: admin override wrong group", function(assert){

	const ruleset = {
		filename: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset.filename,
								rules: null,
								owner_user: null,
								owner_group: 'some group',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {
				//the delete call
				return new Promise((resolve) => {
					resolve();
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRuleSet(ruleset, 'user', 'other group', true).then((filename) => {
		assert.equal(filename, ruleset.filename, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});


QUnit.test( "retrieveRuleSet: can edit with no owner", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {},
								owner_user: null,
								owner_group: null,
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, undefined, undefined, undefined, undefined, undefined).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, true, "Expect to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRuleSet: can edit with same group", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {},
								owner_user: null,
								owner_group: 'test',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, undefined, undefined, undefined, 'test', undefined).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, true, "Expect to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRuleSet: can edit as admin", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {},
								owner_user: null,
								owner_group: 'test',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, undefined, undefined, undefined, 'another group', true).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, true, "Expect to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRuleSet: can't edit as different group", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {},
								owner_user: null,
								owner_group: 'test',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, undefined, undefined, undefined, 'another group', undefined).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, false, "Expect not to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRuleSet: can't edit with no group", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {},
								owner_user: null,
								owner_group: 'test',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, undefined, undefined, undefined, undefined, undefined).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, false, "Expect not to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRuleSet: can't see protected properties", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {
									import: {
										filename: 'S3Import',
										config: {
											accessKey: '12345'
										}
									}
								},
								owner_user: null,
								owner_group: 'test',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, ruleLoader, undefined, undefined, undefined, undefined).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, false, "Expect not to be able to edit");
		assert.equal(ruleset.import.config.accessKey, '********', 'Private config should be blanked out');
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRuleSet: can see protected properties", function(assert){

	const ruleset_filename = 'test';

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{
								id: 0,
								version: 0,
								ruleset_id: ruleset_filename,
								rules: {
									import: {
										filename: 'S3Import',
										config: {
											accessKey: '12345'
										}
									}
								},
								owner_user: null,
								owner_group: 'test',
								update_time: null,
								name: null,
								deleted: false
							}
						]
					})
				});

			} else {

				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	//ruleset_id, rulesetOverrideFile, ruleLoader, version, dbId, group, admin
	data.retrieveRuleset(ruleset_filename, undefined, ruleLoader, undefined, undefined, 'test', undefined).then((ruleset) => {
		assert.ok(ruleset, "Expect to have a ruleset");
		assert.equal(ruleset.canedit, true, "Expect to be able to edit");
		assert.equal(ruleset.import.config.accessKey, '12345', 'Private config should be visible');
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "rulesetValid: unqiue id OK and unique target_file OK", function(assert){

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		target_file: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT count(*)')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: [
							{count: 0}
						]
					})
				});
			} else if(text.startsWith('SELECT')) {
				//the get current row test
				return new Promise((resolve) => {
					resolve({
						rows: []
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.rulesetValid(ruleset, true, true).then(() => {
		assert.ok(true, '');
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "rulesetValid: unqiue id not OK and unique target_file OK", function(assert){

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		target_file: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT count(*)')) {
				//get count of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: [
							{count: 0}
						]
					})
				});
			} else if(text.startsWith('SELECT') && text.includes('.target_file')) {
				//get list of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: []
					})
				});
			} else if(text.startsWith('SELECT')) {
				//the get the row that matches the ruleset_id/filename
				return new Promise((resolve) => {
					resolve({
						rows: [ {
							id: 0,
							version: 0,
							ruleset_id: ruleset.filename,
							rules: {},
							owner_user: null,
							owner_group: 'test',
							update_time: null,
							name: null,
							deleted: false
						}]
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.rulesetValid(ruleset, true, true).then(() => {
		assert.ok(false, 'should have rejected');
		done();
	}, (e) => {
		assert.ok(true, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "rulesetValid: unqiue id OK and unique target_file not OK", function(assert){

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		target_file: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT count(*)')) {
				//get count of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: [
							{count: 1}
						]
					})
				});
			} else if(text.startsWith('SELECT') && text.includes('.target_file')) {
				//get list of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: [{
							id: 0,
							version: 0,
							ruleset_id: ruleset.filename,
							rules: {},
							owner_user: null,
							owner_group: 'test',
							update_time: null,
							name: null,
							deleted: false
						}]
					})
				});
			} else if(text.startsWith('SELECT')) {
				//the get the row that matches the ruleset_id/filename
				return new Promise((resolve) => {
					resolve({
						rows: [ ]
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.rulesetValid(ruleset, true, true).then(() => {
		assert.ok(false, 'should have rejected');
		done();
	}, (e) => {
		assert.ok(true, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "rulesetValid: skip unqiue id and unique target_file OK", function(assert){

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		target_file: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT count(*)')) {
				//get count of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: [
							{count: 0}
						]
					})
				});
			} else if(text.startsWith('SELECT') && text.includes('.target_file')) {
				//get list of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: []
					})
				});
			} else if(text.startsWith('SELECT')) {
				//the get the row that matches the ruleset_id/filename
				return new Promise((resolve) => {
					resolve({
						rows: [ {
							id: 0,
							version: 0,
							ruleset_id: ruleset.filename,
							rules: {},
							owner_user: null,
							owner_group: 'test',
							update_time: null,
							name: null,
							deleted: false
						}]
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.rulesetValid(ruleset, false, true).then(() => {
		assert.ok(true, '');
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "rulesetValid: unqiue id OK and skip unique target_file", function(assert){

	const ruleset = {
		filename: 'test',
		ruleset_id: 'test',
		target_file: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {
			if(text.startsWith('SELECT count(*)')) {
				//get count of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: [
							{count: 1}
						]
					})
				});
			} else if(text.startsWith('SELECT') && text.includes('.target_file')) {
				//get list of rows that match the target file
				return new Promise((resolve) => {
					resolve({
						rows: [{
							id: 0,
							version: 0,
							ruleset_id: ruleset.filename,
							rules: {},
							owner_user: null,
							owner_group: 'test',
							update_time: null,
							name: null,
							deleted: false
						}]
					})
				});
			} else if(text.startsWith('SELECT')) {
				//the get the row that matches the ruleset_id/filename
				return new Promise((resolve) => {
					resolve({
						rows: [ ]
					})
				});
			} else {
				return new Promise((resolve, reject) => {
					reject('not expected');
				});
			}
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.rulesetValid(ruleset, true, false).then(() => {
		assert.ok(true, '');
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.module("");