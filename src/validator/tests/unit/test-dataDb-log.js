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

QUnit.module("DataDb - Log");

QUnit.test( "getLog: Return Correct row and page count - single page", function(assert){
  // Setup mock return value 
  const config = {
		query: (text, values) => {

			return new Promise((resolve) => {
				resolve({
					rows: [{
            id: 0,
            log_id: 0,
            ruleset_id: 0,
            run_id: 0,
            inputfile: null,
            outputfile: null,
            starttime: null,
            finishtime: null,
            log: [{"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "Traceback (most recent call last):", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "description": "Aborting: Too many total errors. Got 1 limit was 1", "problemFile": "Validator"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 166, in <module>", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "api.process(CartoLinkTable)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/api/PythonAPI.py\", line 323, in process", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    instance.run(inputName, outputName, encoding)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 163, in run", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    self.linkTable()", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 143, in linkTable", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    map(lambda x: x[0], self.getColumns(newTable)))", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 27, in getColumns", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    r.raise_for_status()", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/usr/lib/python2.7/site-packages/requests/models.py\", line 935, in raise_for_status", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    raise HTTPError(http_error_msg, response=self)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: http://datavis-maps.dev.bloomberg.com/user/15775613/api/v1/tables/factories_val?api_key=090fdc9b22c64769dc009e79fc6881266254d6b9", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "python exited with status 1.", "problemFile": "RunExternalProcess"}],
            num_errors: 0,
            num_warnings: 0,
            num_dropped: 0,
            summary: null,
            passed: false,
            input_md5: null,
            source_id: 0,
            target_id: 0,
            request_user: null,
            request_group:null 
					}]
				});
      })
		}
	};

	const done = assert.async();
  const data = DataDb(config, true);
  
  data.getLog( 0, 1, 20, null, null ).then((log) => {
    assert.equal(log.rowCount, 16);
    assert.equal(log.pageCount, 1);
    assert.equal(log.logs.length, 16);
    done();
  }, function (err) {
    console.log(err);
    assert.ok(false, 'Error caught in promise: ' + err);
    done();
  });
});

QUnit.test( "getLog: Return Correct row and page count - single page exact row count", function(assert){
  // Setup mock return value 
  const config = {
		query: (text, values) => {

			return new Promise((resolve) => {
				resolve({
					rows: [{
            id: 0,
            log_id: 0,
            ruleset_id: 0,
            run_id: 0,
            inputfile: null,
            outputfile: null,
            starttime: null,
            finishtime: null,
            log: [{"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "Traceback (most recent call last):", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "description": "Aborting: Too many total errors. Got 1 limit was 1", "problemFile": "Validator"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 166, in <module>", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "api.process(CartoLinkTable)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/api/PythonAPI.py\", line 323, in process", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    instance.run(inputName, outputName, encoding)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 163, in run", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    self.linkTable()", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 143, in linkTable", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    map(lambda x: x[0], self.getColumns(newTable)))", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 27, in getColumns", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    r.raise_for_status()", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/usr/lib/python2.7/site-packages/requests/models.py\", line 935, in raise_for_status", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    raise HTTPError(http_error_msg, response=self)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: http://datavis-maps.dev.bloomberg.com/user/15775613/api/v1/tables/factories_val?api_key=090fdc9b22c64769dc009e79fc6881266254d6b9", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "python exited with status 1.", "problemFile": "RunExternalProcess"}],
            num_errors: 0,
            num_warnings: 0,
            num_dropped: 0,
            summary: null,
            passed: false,
            input_md5: null,
            source_id: 0,
            target_id: 0,
            request_user: null,
            request_group:null 
					}]
				});
      })
		}
	};

	const done = assert.async();
  const data = DataDb(config, true);
  
  data.getLog( 0, 1, 16, null, null ).then((log) => {
    assert.equal(log.rowCount, 16);
    assert.equal(log.pageCount, 1);
    assert.equal(log.logs.length, 16);
    done();
  }, function (err) {
    console.log(err);
    assert.ok(false, 'Error caught in promise: ' + err);
    done();
  });
});

QUnit.test( "getLog: Return Correct row and page count - multiple page", function(assert){
  // Setup mock return value 
  const config = {
		query: (text, values) => {

			return new Promise((resolve) => {
				resolve({
					rows: [{
            id: 0,
            log_id: 0,
            ruleset_id: 0,
            run_id: 0,
            inputfile: null,
            outputfile: null,
            starttime: null,
            finishtime: null,
            log: [{"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "Traceback (most recent call last):", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "description": "Aborting: Too many total errors. Got 1 limit was 1", "problemFile": "Validator"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 166, in <module>", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "api.process(CartoLinkTable)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/api/PythonAPI.py\", line 323, in process", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    instance.run(inputName, outputName, encoding)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 163, in run", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    self.linkTable()", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 143, in linkTable", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    map(lambda x: x[0], self.getColumns(newTable)))", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/opt/PLUTO/plugins/postTasks/cartoLinkTable.py\", line 27, in getColumns", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    r.raise_for_status()", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "  File \"/usr/lib/python2.7/site-packages/requests/models.py\", line 935, in raise_for_status", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "    raise HTTPError(http_error_msg, response=self)", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: http://datavis-maps.dev.bloomberg.com/user/15775613/api/v1/tables/factories_val?api_key=090fdc9b22c64769dc009e79fc6881266254d6b9", "problemFile": "RunExternalProcess"}, {"type": "Error", "when": "2018-6-7 14:09:30", "ruleID": "8cb20056-7899-434e-b804-4f986dfa41f3", "description": "python exited with status 1.", "problemFile": "RunExternalProcess"}],
            num_errors: 0,
            num_warnings: 0,
            num_dropped: 0,
            summary: null,
            passed: false,
            input_md5: null,
            source_id: 0,
            target_id: 0,
            request_user: null,
            request_group:null 
					}]
				});
      })
		}
	};

	const done = assert.async();
  const data = DataDb(config, true);
  
  data.getLog( 0, 1, 13, null, null ).then((log) => {
    assert.equal(log.rowCount, 16);
    assert.equal(log.pageCount, 2);
    assert.equal(log.logs.length, 13);
    done();
  }, function (err) {
    console.log(err);
    assert.ok(false, 'Error caught in promise: ' + err);
    done();
  });
});

QUnit.module("");