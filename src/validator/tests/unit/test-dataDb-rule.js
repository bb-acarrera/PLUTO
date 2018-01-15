const proxyquire = require('proxyquire');
const stackTrace = require('stack-trace');

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

QUnit.module("DataDb - Rule");


QUnit.test( "saveRule: Successful", function(assert){

	const rule = {
		rule_id: 'test',
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
								rule_id: rule.rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
								owner_user: null,
								owner_group: null,
								update_time: null,
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

	data.saveRule(rule).then((filename) => {
		assert.equal(filename, rule.rule_id, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRule: Successful same group", function(assert){

	const rule = {
		rule_id: 'test',
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
								rule_id: rule.rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	data.saveRule(rule, 'user', 'some group').then((filename) => {
		assert.equal(filename, rule.rule_id, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "saveRule: Wrong group", function(assert){

	const rule = {
		rule_id: 'test',
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
								rule_id: rule.rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	data.saveRule(rule, 'user', 'other group', false).then((filename) => {
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

QUnit.test( "saveRule: admin and other group", function(assert){

	const rule = {
		rule_id: 'test',
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
								rule_id: rule.rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	data.saveRule(rule, 'user', 'other group', true).then((filename) => {
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

QUnit.test( "saveRule: Wrong version", function(assert){

	const rule = {
		rule_id: 'test',
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
								rule_id: rule.rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	data.saveRule(rule, 'user', 'some group', false).then((filename) => {
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

QUnit.test( "saveRule: Successful same name as deleted", function(assert){

	const rule = {
		rule_id: 'test',
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
								rule_id: rule.rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	data.saveRule(rule, 'user', 'other group').then((filename) => {
		assert.equal(filename, rule.rule_id, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});


function stackTraceHas(functionName, trace) {
	let fnCallSite = trace.find( (callSite) => {
		return callSite.getFunctionName() == functionName;
	});

	return fnCallSite != null;
}

function deleteResults(text, canEditGetRuleRows, inRuleset, inLinkedSource ) {
	const trace = stackTrace.get();

	if(stackTraceHas('getRule', trace)) {
		//the get current row test
		return new Promise((resolve) => {
			resolve({
				rows: canEditGetRuleRows
			})
		});

	} else if(stackTraceHas('getRulesets', trace)) {

		if(inRuleset) {
			if(text.includes('count(*)')) {
				return new Promise((resolve) => {
					resolve({
						rows: [ { count: 1 } ]
					});
				});
			}

			return new Promise((resolve) => {
				resolve({
					rows: [{
						id: 0,
						version: 0,
						ruleset_id: 'parent ruleset',
						rules: {},
						owner_user: null,
						owner_group: null,
						update_time: null,
						name: null,
						deleted: false
					}]
				});
			});
		} else {
			if(text.includes('count(*)')) {
				return new Promise((resolve) => {
					resolve({
						rows: [ { count: 0 } ]
					});
				});
			}

			return new Promise((resolve) => {
				resolve({
					rows: []
				});
			});
		}



	} else if(stackTraceHas('getRules', trace)) {

		if(inLinkedSource) {

			if(text.includes('count(*)')) {
				return new Promise((resolve) => {
					resolve({
						rows: [ { count: 1 } ]
					});
				});
			}

			return new Promise((resolve) => {
				resolve({
					rows: [{
						id: 1,
						version: 0,
						rule_id: 'parent_rule',
						description: null,
						group: null,
						base: null,
						type: null,
						config: null,
						owner_user: null,
						owner_group: null,
						update_time: null,
						name: null,
						deleted: false
					}]
				});
			});

		} else {
			if(text.includes('count(*)')) {
				return new Promise((resolve) => {
					resolve({
						rows: [ { count: 0 } ]
					});
				});
			}

			return new Promise((resolve) => {
				resolve({
					rows: []
				});
			});
		}



	} else if(text.startsWith('INSERT INTO') || text.startsWith('UPDATE')) {
		//the delete call
		return new Promise((resolve) => {
			resolve();
		});
	}
}

QUnit.test( "deleteRule: Successful", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 0,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: null,
					update_time: null,
					name: null,
					deleted: false
				}
			]);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule).then((filename) => {
		assert.equal(filename, rule.rule_id, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRule: Successful same group", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 0,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: 'some group',
					update_time: null,
					name: null,
					deleted: false
				}
			]);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule, 'user', 'some group').then((filename) => {
		assert.equal(filename, rule.rule_id, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRule: Wrong version", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 1,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: 'some group',
					update_time: null,
					name: null,
					deleted: false
				}
			]);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule).then((filename) => {
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

QUnit.test( "deleteRule: Wrong group", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 1,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: 'some group',
					update_time: null,
					name: null,
					deleted: false
				}
			]);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule, 'user', 'other group').then((filename) => {
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

QUnit.test( "deleteRule: admin override wrong group", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 0,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: 'some group',
					update_time: null,
					name: null,
					deleted: false
				}
			]);

		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule, 'user', 'other group', true).then((filename) => {
		assert.equal(filename, rule.rule_id, "Expect filename to be the same");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject');
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception');
		done();
	});

});

QUnit.test( "deleteRule: in use by ruleset", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 0,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: null,
					update_time: null,
					name: null,
					deleted: false
				}
			], true, false);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule).then((filename) => {
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

QUnit.test( "deleteRule: in use as linked target", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 0,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: null,
					update_time: null,
					name: null,
					deleted: false
				}
			], false, true);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule).then((filename) => {
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

QUnit.test( "deleteRule: in use as linked target and used by ruleset", function(assert){

	const rule = {
		rule_id: 'test',
		version: 0
	};

	const config = {
		query: (text, values) => {

			return deleteResults(text, [
				{
					id: 0,
					version: 0,
					rule_id: rule.rule_id,
					description: null,
					group: null,
					base: null,
					type: null,
					config: null,
					owner_user: null,
					owner_group: null,
					update_time: null,
					name: null,
					deleted: false
				}
			], true, true);
		}
	};

	const done = assert.async();
	const data = DataDb(config, true);

	data.deleteRule(rule).then((filename) => {
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


QUnit.test( "retrieveRule: can edit with no owner", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, undefined, undefined, undefined).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, true, "Expect to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRule: can edit with same group", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, 'test', undefined, undefined).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, true, "Expect to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRule: can edit as admin", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, 'another group', true, undefined).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, true, "Expect to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRule: can't edit as different group", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, 'another group', undefined, undefined).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, false, "Expect not to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRule: can't edit with no group", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: null,
								type: null,
								config: null,
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, undefined, undefined, undefined).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, false, "Expect not to be able to edit");
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRule: can't see protected properties", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: 'S3Import',
								type: 'source',
								config: {
									accessKey: '12345'
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, undefined, undefined, ruleLoader).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, false, "Expect not to be able to edit");
		assert.equal(rule.config.accessKey, '********', 'Private config should be blanked out');
		done();
	}, (e) => {
		assert.ok(false, 'Got reject: ' + e);
		done();
	}).catch((e) => {
		assert.ok(false, 'Got exception: ' + e);
		done();
	});

});

QUnit.test( "retrieveRule: can see protected properties", function(assert){

	const rule_id = 'test';

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
								rule_id: rule_id,
								description: null,
								group: null,
								base: 'S3Import',
								type: 'source',
								config: {
									accessKey: '12345'
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

	//rule_id, version, dbId, group, admin, rulesLoader
	data.retrieveRule(rule_id, undefined, undefined, 'test', undefined, ruleLoader).then((rule) => {
		assert.ok(rule, "Expect to have a rule");
		assert.equal(rule.canedit, true, "Expect to be able to edit");
		assert.equal(rule.config.accessKey, '12345', 'Private config should be visible');
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