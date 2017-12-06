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

QUnit.module("DataDb");

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

	data.saveRuleSet(ruleset).then((filename) => {
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

	data.saveRuleSet(ruleset, 'user', 'some group').then((filename) => {
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

	data.saveRuleSet(ruleset, 'user', 'other group', false).then((filename) => {
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

	data.saveRuleSet(ruleset, 'user', 'other group', true).then((filename) => {
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

	data.saveRuleSet(ruleset, 'user', 'some group', false).then((filename) => {
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

	data.saveRuleSet(ruleset, 'user', 'other group').then((filename) => {
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

QUnit.module("");