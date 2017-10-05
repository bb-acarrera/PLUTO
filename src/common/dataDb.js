const fs = require('fs-extra');
const path = require("path");

const Util = require("./Util");
const RuleSet = require("../validator/RuleSet");
const DB = require("./db");
const ErrorHandlerAPI = require('../api/errorHandlerAPI');



class data {
    constructor(config) {
        this.config = config || {};

        this.db = DB(this.config);


        this.runsLimit = 50;
        this.rulesetLimit = 50;
        this.logLimit = 50;

        let schemaName = config.dbSchema || 'pluto';
        if(schemaName.length > 0) {
            schemaName = schemaName + '.';
        }

        this.tables = {
            runs: schemaName + 'runs',
            rulesets: schemaName + 'rulesets'
        }
    }

    end() {
        this.db.end();
    }

    /**
     * This method is used by the application to get an in-memory copy of a log file managed by
     * the plugin.
     * @param id {string} the id of the log file to retrieve.
     * @returns {Promise} resolves {object} the contents of the log file.
     * @throws Throws an error if the copy cannot be completed successfully.
     */
    getLog(id, page, size, ruleid, type) {

        if(!size) {
            size = this.logLimit;
        }

        let offset;
        if(!page) {
            offset = 0;
        } else {
            offset = (page - 1) * size;
        }

        if(type && type.length === 0) {
            type = null;
        }
        if(ruleid && ruleid.length === 0) {
            ruleid = null;
        }

        return new Promise((resolve, reject) => {
            this.db.query(updateTableNames("SELECT log FROM {{runs}} where id = $1", this.tables), [id])
                .then((result) => {

                    if(result.rows.length > 0) {

                        let log = result.rows[0].log;

                        if(!log) {
                            log = [];
                        }

                        let logResp = [];
                        let resultMap = {};
                        let filteredLog;
                        let filter, rowRuleId;

                        if(type || ruleid) {
                            filteredLog = [];
                            filter = true;
                        } else {
                            filteredLog = log;
                            filter = false;
                        }

                        log.forEach(function(value){

                            if(!value.ruleID) {
                                rowRuleId = "global";
                            }else {
                                rowRuleId = value.ruleID;
                            }

                            if(!resultMap[rowRuleId]) {
                                resultMap[rowRuleId]={
                                    err: false,
                                    warn: false
                                };
                            }
                            if(value.type == 'Error') {
                              resultMap[rowRuleId].err = true;
                            }
                            if(value.type == 'Warning') {
                              resultMap[rowRuleId].warn = true;
                            }

                            if(filter) {
                                if((!type || type == value.type) && (!ruleid || rowRuleId == ruleid )) {
                                    filteredLog.push(value);
                                }
                            }
                        });


                        if(filteredLog.length < size) {
                            if(offset != 0) {
                                logResp = [];
                            } else {
                                logResp = filteredLog;
                            }
                        } else {
                            logResp = filteredLog.splice(offset, size);
                        }

                        resolve({logs: logResp,
                          rowCount: filteredLog.length,
                          pageCount: Math.ceil(filteredLog.length / size),
                          ruleStates: resultMap});
                    } else {
                        resolve(null);
                    }

                }, (error) => {
                    reject(error);
                });
        });
    }

    /**
     * This method is used by the application to get an in-memory copy of a run managed by
     * the plugin.
     * @param id {string} the name of the run file to retrieve.
     * @returns {Promise} resolves {object} the contents of the run file.
     */
    getRun(id) {
        return new Promise((resolve, reject) => {

            let query = getRunQuery(this.tables) + updateTableNames(" WHERE {{runs}}.id = $1", this.tables);

            this.db.query(query, [id])
                .then((result) => {

                    if(result.rows.length > 0) {
                        resolve(getRunResult(result.rows[0]));
                    } else {
                        resolve(null);
                    }

                }, (error) => {
                    reject(error);
                });

        });
    }

    /**
     * This method is used by the application to get an in-memory copy of all runs managed by
     * the plugin.
     * @returns {Promise} resolves {array} list of the runs.
     */
    getRuns(page, size) {

        let offset;

        if(!size) {
           size = this.runsLimit;
        }

        if(!page) {
            offset = 0;
        } else {
            offset = (page - 1) * size;
        }


        return new Promise((resolve, reject) => {

            let where = "";

            let runsQuery = this.db.query(getRunQuery(this.tables) +
                " ORDER BY finishtime DESC NULLS LAST, starttime DESC LIMIT $1 OFFSET $2 " + where, [size, offset] );

            let countQuery = this.db.query(updateTableNames("SELECT count(*) FROM {{runs}} " +
                "LEFT OUTER JOIN {{rulesets}} ON {{runs}}.ruleset_id = {{rulesets}}.id " + where, this.tables));

            Promise.all([runsQuery, countQuery]).then((values) => {

                let result = values[0];
                let countResult = values[1];

                let rowCount = countResult.rows[0].count;
                let pageCount = Math.ceil(rowCount/size);

                let runs = [];
                result.rows.forEach((row) => {
                    runs.push(getRunResult(row));
                });

                resolve({
                    runs: runs,
                    rowCount: rowCount,
                    pageCount: pageCount
                });

            }, (error) => {
                reject(error);
            });

        });
    }

    createRunRecord(ruleSetID) {

        return new Promise((resolve, reject) => {

            this.db.query(updateTableNames("SELECT id FROM {{rulesets}} WHERE ruleset_id = $1", this.tables),
                [ruleSetID]).then((result) => {

                let rulesetId = null;
                if (result.rows.length > 0) {
                    rulesetId = result.rows[0].id
                }

                let date = new Date();

                this.db.query(updateTableNames("INSERT INTO {{runs}} (ruleset_id, starttime, finishtime) " +
                        "VALUES($1, $2, $3) RETURNING id", this.tables),
                    [rulesetId, date, date])
                    .then((result) => {
                        resolve(result.rows[0].id);
                    }, (error) => {
                        console.log(error);
                        reject(error);
                    });

            }, (error) => {
                console.log(error);
                reject(error);
            });
        });
    }

    /**
     * This method saves record which is used by the client code to reference files for any particular run.
     * @param runId the unique ID of the run.
     * @param log the log
     * @param ruleSetId the id of the ruleset
     * @param inputFile the name of the input file
     * @param outputFile the name of the output file
     */
     saveRunRecord(runId, log, ruleSetID, inputFile, outputFile, logCounts) {

        return new Promise((resolve, reject) => {
            let numErrors = logCounts[ErrorHandlerAPI.ERROR] || 0;
        	let numWarnings = logCounts[ErrorHandlerAPI.WARNING] || 0;

        	this.db.query(updateTableNames("UPDATE {{runs}} SET " +
        	    "inputfile = $2, outputfile = $3, finishtime = $4, log = $5, num_errors = $6, num_warnings = $7  " +
            	"WHERE id = $1", this.tables),
            	[runId, inputFile, outputFile, new Date(), JSON.stringify(log), numErrors, numWarnings])
            	.then(() => {
            		resolve();
            	}, (error) => {
                	console.log(error);
                	reject(error);
            	});
        });

    }

    /**
     * Retrieve a ruleset description.
     * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
     * @param rulesetOverrideFile the filename of an override file to apply to the ruleset
     * @return a promise to an object describing a ruleset.
     */
    retrieveRuleset(ruleset_id, rulesetOverrideFile, version) {

        return getRuleset(this.db, ruleset_id, version, this.tables, (result, resolve, reject) => {
            if(result.rows.length > 0) {
                let dbRuleset = result.rows[0].rules;

                // PJT 17/09/01 - Unfortunately at the moment there are three senses for an ID on a ruleset.
                // They are the database row number, the "filename" (which till now has also been the "id")
                // and the "ruleset_id". We want to simplify this to just two, the database row number (henceforth
                // the "id") which uniquely identifies a ruleset by ruleset_id & version, and the ruleset_id which
                // excludes the version (and will eventually be used to get the most up-to-date version of a ruleset.)
                // Here we get rid of the sense that the id is the same as the filename and instead make it the
                // same as the database row.
                dbRuleset.id = result.rows[0].id;

                dbRuleset.filename = ruleset_id;
                dbRuleset.name = dbRuleset.name || ruleset_id;
                let ruleset = new RuleSet(dbRuleset);

                if (rulesetOverrideFile && typeof rulesetOverrideFile === 'string') {
                    ruleset.applyOverride(rulesetOverrideFile);
                }

                resolve(ruleset);

            } else {
                resolve(null);
            }
        });

    }

    rulesetExists(ruleset_id, version) {
        return getRuleset(this.db, ruleset_id, version, this.tables, (result, resolve, reject) => {
            if(result.rows.length > 0) {
               resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * This file saves the given ruleset to the database
     * @param ruleset the ruleset to write.
     * @private
     */
    saveRuleSet(ruleset) {

        return new Promise((resolve, reject) => {

            let name = ruleset.filename;

            this.db.query(
                updateTableNames("SELECT id FROM {{rulesets}} WHERE ruleset_id = $1 AND version = 0", this.tables),
                [name])
                .then((result) => {
                    let qry;
                    if(result.rows.length === 0) {
                        qry = this.db.query(updateTableNames("INSERT INTO {{rulesets}} (ruleset_id, name, version, rules) " +
                            "VALUES($1, $2, $3, $4) RETURNING id", this.tables),
                            [ruleset.filename, ruleset.name, 0, JSON.stringify(ruleset)]);
                    } else {
                        qry = this.db.query(updateTableNames("UPDATE {{rulesets}} SET rules = $2, name = $3 WHERE id = $1", this.tables),
                            [result.rows[0].id, JSON.stringify(ruleset), ruleset.name]);
                    }

                    qry.then(() => {
                        resolve(name);
                    }, (error) => {
                        reject(error)
                    });

                }, (error) => {
                    console.log(error);
                    reject(error);
                })
                .catch((error) => {
                    console.log(error);
                    reject(error);
                });
        });


    }

    /**
     * This deletes the given ruleset from the database
     * @param ruleset the ruleset to delete.
     * @private
     */
    deleteRuleSet(ruleset) {

        return new Promise((resolve, reject) => {

            let ruleset_id = ruleset.ruleset_id || ruleset.filename;

            this.db.query(updateTableNames("DELETE FROM {{rulesets}} WHERE ruleset_id = $1 AND version = 0", this.tables),
                [ruleset_id])
                .then(() => {
                    resolve(ruleset_id);
                }, (error) => {
                    console.log(error);
                })
                .catch((error) => {
                    console.log(error);
                });
        });


    }

    /**
     * This gets the list of rulesets.
     * @return a promise to an array of ruleset ids.
     */
    getRulesets(page, size) {

        return new Promise((resolve) => {

            if(!size) {
                size = this.rulesetLimit;
            }

            let offset;
            if(!page) {
                offset = 0;
            } else {
                offset = (page - 1) * size;
            }

            let rulesetsQuery = this.db.query(updateTableNames("SELECT * FROM {{rulesets}} " +
                "ORDER BY name ASC LIMIT $1 OFFSET $2", this.tables), [size, offset] );

            let countQuery = this.db.query(updateTableNames("SELECT count(*) FROM {{rulesets}}", this.tables));

            Promise.all([rulesetsQuery, countQuery]).then((values) => {

                let result = values[0];
                let countResult = values[1];

                let rowCount = countResult.rows[0].count;
                let pageCount = Math.ceil(rowCount/size);

                var rulesets = [];

                result.rows.forEach((ruleset) => {
                    ruleset.filename = ruleset.filename || ruleset.ruleset_id;
                    rulesets.push(ruleset);
                });

                resolve({
                    rulesets:rulesets,
                    rowCount: rowCount,
                    pageCount: pageCount});


            }, (error) => {
                reject(error);
            });

        });


    }
}

function updateTableNames(query, tableNames) {

    let resp = query;

    for(var key of Object.keys(tableNames)) {
        let name = "{{" + key + "}}";
        while(resp.indexOf(name) >= 0) {
            resp = resp.replace(name, tableNames[key]);
        }

    }

    if(resp.indexOf('{{') >= 0) {
        console.log("Unknown table replace in query: " + resp);
        throw "Unknown table replace in query: " + resp;
    }

    return resp;
}

function getRunQuery(tableNames) {
    return updateTableNames("SELECT {{runs}}.id, {{rulesets}}.ruleset_id, run_id, inputfile, outputfile, finishtime, num_errors, num_warnings, starttime " +
        "FROM {{runs}} " +
        "LEFT OUTER JOIN {{rulesets}} ON {{runs}}.ruleset_id = {{rulesets}}.id", tableNames);
}

function getRunResult(row) {

    let isRunning = row.num_warnings == null && row.num_errors == null;

    return {
        id: row.id,
        log: row.id,
        ruleset: row.ruleset_id,
        inputfilename: row.inputfile,
        outputfilename: row.outputfile,
        time: row.finishtime,
        starttime: row.starttime,
        errorcount: row.num_errors,
        warningcount: row.num_warnings,
        isrunning: isRunning
    };
}

function getRuleset(db, ruleset_id, version, tables, callback) {
    if(!version) {
        version = 0;
    }

    if (!ruleset_id) {
        return new Promise((resolve, reject) => {
            reject("No ruleset_id provided")
        });
    }

    if (ruleset_id.endsWith(".json"))
        ruleset_id = ruleset_id.substr(0, ruleset_id.length - 5);

    return new Promise((resolve, reject) => {

        db.query(updateTableNames("SELECT rules, id FROM {{rulesets}} " +
                "where ruleset_id = $1 AND version = $2", tables),
            [ruleset_id, version])
            .then((result) => {

                callback(result, resolve, reject);

            }, (error) => {
                reject(error);
            });

    });
}

let dataInstance = null;

module.exports = (config) => {
    if(dataInstance) {
        return dataInstance;
    }

    if(config) {
        dataInstance = new data(config);
    }

    return dataInstance;
};
