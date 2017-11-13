const fs = require('fs-extra');
const path = require("path");

const Util = require("./Util");
const RuleSet = require("../validator/RuleSet");

class data {
    constructor(config) {
        this.config = config || {};

        this.rootDir = Util.getRootDirectory(this.config);

        if (this.config.rulesetDirectory)
            this.rulesetDirectory = path.resolve(this.rootDir, this.config.rulesetDirectory);
        else
            this.rulesetDirectory = path.resolve('rulesets');

        if (!fs.existsSync(this.rulesetDirectory))
            throw "Failed to find RulesetDirectory \"" + this.config.rulesetDirectory + "\".\n";

        this.runsDirectory = path.resolve(this.rootDir, this.config.runsDirectory);
        this.logDirectory = path.resolve(this.rootDir, this.config.logDirectory);
    }

    end() {
    }

    /**
     * This method is used by the application to get an in-memory copy of a log file managed by
     * the plugin.
     * @param id {string} the id of the log file to retrieve.
     * @returns {Promise} resolves {object} the contents of the log file.
     * @throws Throws an error if the copy cannot be completed successfully.
     */
    getLog(id) {

        throw("Not implemented");

    }

    /**
     * This method is used by the application to save the log of results for the given file synchronously.
     * @param inputName {string} the name of the file to save.
     * @param log {object} the log.
     * @throws Throws an error if the directory cannot be found or the file saved.
     * @private
     */
    saveLog(inputName, log) {
        try {
            if (!fs.existsSync(this.logDirectory))
                fs.mkdirSync(this.logDirectory);	// Make sure the logDirectory exists.
        }
        catch (e) {
            console.error(this.constructor.name + " failed to create \"" + this.logDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
            throw e;
        }

        const basename = path.basename(inputName, path.extname(inputName)) + '_' + Util.getCurrentDateTimeString() + ".log.json";

        fs.writeFileSync(path.resolve(this.logDirectory, basename), JSON.stringify(log), 'utf8');

        return basename;
    }

    /**
     * This method is used by the application to get an in-memory copy of a run managed by
     * the plugin.
     * @param id {string} the name of the run file to retrieve.
     * @returns {Promise} resolves {object} the contents of the run file.
     * @throws Throws an error if the copy cannot be completed successfully.
     */
    getRun(id) {

        throw('Not implemented');
    }

    /**
     * This method is used by the application to get an in-memory copy of all runs managed by
     * the plugin.
     * @returns {Promise} resolves {array} list of the runs.
     */
    getRuns() {

        throw('Not implemented');

    }

    /**
     * This method saves record which is used by the client code to reference files for any particular run.
     * @param runId the unique ID of the run.
     * @param log the log
     * @param ruleSetId the id of the ruleset
     * @param inputFile the name of the input file
     * @param outputFile the name of the output file
     */
    saveRunRecord(runId, log, ruleSetId, inputFile, outputFile) {

        return new Promise((resolve, reject) => {

            let logId = this.saveLog(inputFile, log);

            try {
                if (!fs.existsSync(this.runsDirectory))
                    fs.mkdirSync(this.runsDirectory);	// Make sure the runsDirectory exists.
            }
            catch (e) {
                console.error(this.constructor.name + " failed to create \"" + this.runsDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
                reject(e);
            }

            const run = {
                id: runId,
                log: logId,
                ruleset: ruleSetId,
                inputfilename: inputFile,
                outputfilename: outputFile,
                time: new Date()
            };


            fs.writeFileSync(path.resolve(this.runsDirectory, runId), JSON.stringify(run), 'utf8');

            resolve();

        });

    }

    /**
     * Retrieve a ruleset description.
     * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
     * @param rulesetOverrideFile the filename of an override file to apply to the ruleset
     * @return a promise to an object describing a ruleset.
     */
    retrieveRuleset(ruleset, rulesetOverrideFile, ruleLoader) {
        return new Promise((resolve, reject) => {

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


            let rulesetObj = new RuleSet(ruleset, ruleLoader);

            if (rulesetOverrideFile && typeof rulesetOverrideFile === 'string') {
                rulesetObj.applyOverride(rulesetOverrideFile);
            }

            resolve(rulesetObj);
        });
    }

    /**
     * This saves the given ruleset to a file in the configured Ruleset directory. The name of the file is
     * taken from the ruleset's 'filename' property with '.json' appended to it by this function and if a file with
     * that name already exists it will be overwritten. The file is written using 'utf8'.
     * @param ruleset the ruleset to write.
     */
    saveRuleSet(ruleset) {
        throw("Not implemented");
    }

    /**
     * This gets the list of rulesets.
     * @return a promise to an array of ruleset ids.
     */
    getRulesets() {

        throw("Not implemented");


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
