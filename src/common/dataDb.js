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

        if (this.rulesetDirectory)
            this.rulesetDirectory = path.resolve(this.rootDir, this.config.rulesetDirectory);
        else
            this.rulesetDirectory = path.resolve('runtime/rulesets');

        if (!fs.existsSync(this.rulesetDirectory))
            throw "Failed to find RulesetDirectory \"" + this.config.rulesetDirectory + "\".\n";

        this.runsDirectory = path.resolve(this.rootDir, this.config.runsDirectory);
        this.logDirectory = path.resolve(this.rootDir, this.config.logDirectory);

        this.runsLimit = 50;
    }

    /**
     * This method is used by the application to get an in-memory copy of a log file managed by
     * the plugin.
     * @param logFileName {string} the name of the log file to retrieve.
     * @returns {string} the contents of the log file.
     * @throws Throws an error if the copy cannot be completed successfully.
     * @private
     */
    getLog(id) {

        return new Promise((resolve, reject) => {
            this.db.query("SELECT log FROM runs where run_id = $1", [id])
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
     * @param runFileName {string} the name of the run file to retrieve.
     * @returns {string} the contents of the run file.
     * @throws Throws an error if the copy cannot be completed successfully.
     * @private
     */
    getRun(id) {
        return new Promise((resolve, reject) => {

            this.db.query("SELECT id, ruleset_id, run_id, inputfile, outputfile, finishtime, log FROM runs where run_id = $1", [id])
                .then((result) => {

                    if(result.rows.length > 0) {
                        let row = result.rows[0];
                        resolve({
                            id: row.run_id,
                            log: row.run_id,
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
     * @returns {array} list of the run file.
     * @private
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

            this.db.query("SELECT id, ruleset_id, run_id, inputfile, outputfile, finishtime FROM runs " +
                "ORDER BY finishtime DESC LIMIT $1 OFFSET $2", [this.runsLimit, offset] )
                .then((result) => {

                    result.rows.forEach((row) => {
                        runs.push({
                            id: row.run_id,
                            log: row.id,
                            ruleset: row.ruleset_id,
                            inputfilename: row.inputFile,
                            outputfilename: row.outputFile,
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
     * @returns undefined
     * @private
     */
    saveRunRecord(runId, log, ruleSetId, inputFile, outputFile) {

        this.db.query("INSERT INTO runs (run_id, ruleset_id, inputfile, outputfile, finishtime, log) " +
            "VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
            [runId, 0, inputFile, outputFile, new Date(), JSON.stringify(log)])
            .then(() => {
                return;
            }, (error) => {
                console.log(error);
            });

    }

    /**
     * Retrieve a ruleset description.
     * @param rootDir the directory that may contain the ruleset file.
     * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
     * @return an object describing a ruleset.
     */
    retrieveRuleset(ruleset, rulesetOverrideFile) {
        if (typeof ruleset === 'string') {
            // Identifying a file to load.
            const rulesetFile = path.resolve(this.rulesetDirectory, ruleset);
            var contents;
            try {
                contents = require(rulesetFile);
            }
            catch (e) {
                throw("Failed to load ruleset file \"" + rulesetFile + "\".\n\t" + e);
            }

            if (!contents.ruleset) {
                throw("Ruleset file \"" + rulesetFile + "\" does not contain a 'ruleset' member.");
            }

            contents.ruleset.filename = ruleset;
            contents.ruleset.name = contents.ruleset.name || contents.ruleset.filename;
            ruleset = contents.ruleset;
        }

        if(rulesetOverrideFile && typeof rulesetOverrideFile === 'string') {
            var contents;
            try {
                contents = require(rulesetOverrideFile);
            }
            catch (e) {
                throw("Failed to load ruleset override file \"" + rulesetOverrideFile + "\".\n\t" + e);
            }

            if(contents.import) {
                if(!ruleset.import) {
                    ruleset.import = {};
                }

                Object.assign(ruleset.import.config, contents.import);
            }

            if(contents.export) {
                if(!ruleset.export) {
                    ruleset.export = {};
                }

                Object.assign(ruleset.export, contents.export);
            }
        }

        return new RuleSet(ruleset);
    }

    /**
     * This file saves the given ruleset to a file in the configured Ruleset directory. The name of the file is
     * taken from the ruleset's 'filename' property with '.json' appended to it by this function and if a file with
     * that name already exists it will be overwritten. The file is written using 'utf8'.
     * @param ruleset the ruleset to write.
     * @private
     */
    saveRuleSet(ruleset) {
        fs.writeFileSync(path.resolve(this.rulesetDirectory, ruleset.filename + ".json"), JSON.stringify(ruleset.toJSON()), 'utf8');
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
