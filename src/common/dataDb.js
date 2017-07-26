const fs = require('fs-extra');
const path = require("path");

const Util = require("./Util");
const RuleSet = require("../validator/RuleSet");
const DB = require("./db");

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

            this.db.query("SELECT runs.id, rulesets.ruleset_id, run_id, inputfile, outputfile, finishtime, log FROM runs " +
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

            this.db.query("SELECT runs.id, rulesets.ruleset_id, runs.run_id, runs.inputfile, runs.outputfile, runs.finishtime FROM runs " +
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
                            time: row.finishtime
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
     saveRunRecord(runId, log, ruleSetID, inputFile, outputFile) {

        this.db.query("SELECT id FROM rulesets WHERE ruleset_id = $1", [ruleSetID]).then((result) => {

            if(result.rows.length > 0) {
                this.db.query("INSERT INTO runs (run_id, ruleset_id, inputfile, outputfile, finishtime, log) " +
                        "VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
                    [runId, result.rows[0].id, inputFile, outputFile, new Date(), JSON.stringify(log)])
                    .then(() => {
                        return;
                    }, (error) => {
                        console.log(error);
                    });
            } else {
                console.log("Cannot find ruleset " + ruleSetID + " in database");

                this.db.query("INSERT INTO runs (run_id, ruleset_id, inputfile, outputfile, finishtime, log) " +
                        "VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
                    [runId, null, inputFile, outputFile, new Date(), JSON.stringify(log)])
                    .then(() => {
                        return;
                    }, (error) => {
                        console.log(error);
                    });
            }
        });



    }

    /**
     * Retrieve a ruleset description.
     * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
     * @param rulesetOverrideFile the filename of an override file to apply to the ruleset
     * @return a promise to an object describing a ruleset.
     */
    retrieveRuleset(ruleset_id, rulesetOverrideFile, version) {

        if(!version) {
            version = 0;
        }

        if (!ruleset_id)
            return;

        if (ruleset_id.endsWith(".json"))
            ruleset_id = ruleset_id.substr(0, ruleset_id.length - 5);

        return new Promise((resolve, reject) => {

            this.db.query("SELECT rules FROM rulesets " +
                "where ruleset_id = $1 AND version = $2",
                [ruleset_id, version])
                .then((result) => {

                    if(result.rows.length > 0) {
                        let contents = result.rows[0].rules;

                        contents.ruleset.filename = ruleset_id;
                        contents.ruleset.name = contents.ruleset.name || contents.ruleset.filename;
                        let ruleset = new RuleSet(contents.ruleset);

                        if (rulesetOverrideFile && typeof rulesetOverrideFile === 'string') {
                            ruleset.applyOverride(rulesetOverrideFile);
                        }

                        resolve(ruleset);

                    } else {
                        resolve(null);
                    }

                }, (error) => {
                    reject(error);
                });

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

            this.query("SELECT id FROM rulesets WHERE ruleset_id = $1 AND version = 0", [name])
                .then((result) => {
                    if(result.rows.length === 0) {
                        this.query("INSERT INTO rulesets (ruleset_id, name, version, rules) " +
                            "VALUES($1, $2, $3, $4) RETURNING id", [ruleset.filename, ruleset.name, 0, JSON.stringify(ruleset)]);
                    } else {
                        this.query("UPDATE rulesets SET rules = $2, SET name = $3 WHERE id = $1",
                            [result.rows[0].id, JSON.stringify(ruleset), ruleset.name]);
                    }

                    resolve(name);
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

            this.db.query("SELECT ruleset_id, version, name FROM rulesets " +
                    "ORDER BY name ASC LIMIT $1 OFFSET $2", [this.rulesetLimit, offset] )
                .then((result) => {

                    var rulesets = [];

                    result.rows.forEach((row) => {
                        rulesets.push({
                            id: row.ruleset_id,
                            version: row.version,
                            name: row.name
                        });
                    });

                    resolve(rulesets);

                }, (error) => {
                    reject(error);
                });

        });


    }
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
