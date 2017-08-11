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

        this.rootDir = Util.getRootDirectory(this.config);

        if (this.config.rulesetDirectory)
            this.rulesetDirectory = path.resolve(this.rootDir, this.config.rulesetDirectory);
        else
            this.rulesetDirectory = path.resolve('runtime/rulesets');

        if (!fs.existsSync(this.rulesetDirectory))
            throw "Failed to find RulesetDirectory \"" + this.config.rulesetDirectory + "\".\n";

        this.runsDirectory = path.resolve(this.rootDir, this.config.runsDirectory);
        this.logDirectory = path.resolve(this.rootDir, this.config.logDirectory);

        this.runsLimit = 50;
        this.rulesetLimit = 50;
    }

    /**
     * This method is used by the application to get an in-memory copy of a log file managed by
     * the plugin.
     * @param id {string} the id of the log file to retrieve.
     * @returns {Promise} resolves {object} the contents of the log file.
     * @throws Throws an error if the copy cannot be completed successfully.
     */
    getLog(id) {

        return new Promise((resolve, reject) => {
            this.db.query("SELECT log FROM runs where id = $1", [id])
                .then((result) => {

                    if(result.rows.length > 0) {
                        resolve(result.rows[0].log);
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

            this.db.query("SELECT runs.id, rulesets.ruleset_id, run_id, inputfile, outputfile, finishtime, log, num_errors, num_warnings " +
                "FROM runs " +
                "INNER JOIN rulesets ON runs.ruleset_id = rulesets.id " +
                "where run_id = $1", [id])
                .then((result) => {

                    if(result.rows.length > 0) {
                        let row = result.rows[0];
                        resolve({
                            id: row.run_id,
                            log: row.id,
                            ruleset: row.ruleset_id,
                            inputfilename: row.inputFile,
                            outputfilename: row.outputFile,
                            time: row.finishtime,
                            errorcount: row.num_errors,
                            warningcount: row.num_warnings,
                            log_results: row.log
                        });
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
    getRuns(page) {

        let offset;
        if(!page) {
            offset = 0;
        } else {
            offset = page * this.runsLimit;
        }

        return new Promise((resolve, reject) => {
            var runs = [];

            this.db.query("SELECT runs.id, rulesets.ruleset_id, runs.run_id, runs.inputfile, runs.outputfile, " +
                "runs.finishtime, runs.num_errors, runs.num_warnings " +
                "FROM runs " +
                "INNER JOIN rulesets ON runs.ruleset_id = rulesets.id " +
                "ORDER BY finishtime DESC LIMIT $1 OFFSET $2", [this.runsLimit, offset] )
                .then((result) => {

                    result.rows.forEach((row) => {
                        runs.push({
                            id: row.run_id,
                            log: row.id,
                            ruleset: row.ruleset_id,
                            inputfilename: row.inputfile,
                            outputfilename: row.outputfile,
                            time: row.finishtime,
                            errorcount: row.num_errors,
                            warningcount: row.num_warnings
                        });
                    });

                    resolve(runs);

                }, (error) => {
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

        this.db.query("SELECT id FROM rulesets WHERE ruleset_id = $1", [ruleSetID]).then((result) => {

            let rulesetId = null;
            if(result.rows.length > 0) {
                rulesetId = result.rows[0].id
            }

            let numErrors = logCounts[ErrorHandlerAPI.ERROR] || 0;
            let numWarnings = logCounts[ErrorHandlerAPI.WARNING] || 0;

            this.db.query("INSERT INTO runs (run_id, ruleset_id, inputfile, outputfile, finishtime, log, num_errors, num_warnings) " +
                    "VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
                [runId, rulesetId, inputFile, outputFile, new Date(), JSON.stringify(log), numErrors, numWarnings])
                .then(() => {
                    return;
                }, (error) => {
                    console.log(error);
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

        return getRuleset(this.db, ruleset_id, version, (result, resolve, reject) => {
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

    }

    /**
     * This file saves the given ruleset to the database
     * @param ruleset the ruleset to write.
     * @private
     */
    saveRuleSet(ruleset) {

        return new Promise((resolve, reject) => {

            let name = ruleset.filename;

            this.db.query("SELECT id FROM rulesets WHERE ruleset_id = $1 AND version = 0", [name])
                .then((result) => {
                    if(result.rows.length === 0) {
                        this.db.query("INSERT INTO rulesets (ruleset_id, name, version, rules) " +
                            "VALUES($1, $2, $3, $4) RETURNING id", [ruleset.filename, ruleset.name, 0, JSON.stringify(ruleset)]);
                    } else {
                        this.db.query("UPDATE rulesets SET rules = $2, name = $3 WHERE id = $1",
                            [result.rows[0].id, JSON.stringify(ruleset), ruleset.name]);
                    }

                    resolve(name);
                }, (error) => {
                    console.log(error);
                })
                .catch((error) => {
                    console.log(error);
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

            this.db.query("DELETE FROM rulesets WHERE ruleset_id = $1 AND version = 0", [ruleset_id])
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
    getRulesets(page) {

        return new Promise((resolve) => {

            let offset;
            if(!page) {
                offset = 0;
            } else {
                offset = page * this.runsLimit;
            }

            this.db.query("SELECT * FROM rulesets " +
                    "ORDER BY name ASC LIMIT $1 OFFSET $2", [this.rulesetLimit, offset] )
                .then((result) => {

                    var rulesets = [];

                    result.rows.forEach((ruleset) => {
                        ruleset.filename = ruleset.filename || ruleset.ruleset_id;
                        rulesets.push(ruleset);
                    });

                    resolve(rulesets);

                }, (error) => {
                    reject(error);
                });

        });


    }
}

function getRuleset(db, ruleset_id, version, callback) {
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

        db.query("SELECT rules, id FROM rulesets " +
                "where ruleset_id = $1 AND version = $2",
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
