const fs = require('fs-extra');
const path = require("path");

const Util = require("./Util");
const RuleSet = require("../validator/RuleSet");

class data {
    constructor(config) {
        this.config = config || {};

        this.rootDir = Util.getRootDirectory(this.config);

        if (this.rulesetDirectory)
            this.rulesetDirectory = path.resolve(this.rootDir, this.config.rulesetDirectory);
        else
            this.rulesetDirectory = path.resolve('runtime/rulesets');

        if (!fs.existsSync(this.rulesetDirectory))
            throw "Failed to find RulesetDirectory \"" + this.config.rulesetDirectory + "\".\n";

        this.runsDirectory = path.resolve(this.rootDir, this.config.runsDirectory);
        this.logDirectory = path.resolve(this.rootDir, this.config.logDirectory);
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
        const logfile = path.resolve(this.logDirectory, id);
        var log;
        if (fs.existsSync(logfile)) {
            const contents = fs.readFileSync(logfile, 'utf8');
            try {
                log = JSON.parse(contents);
            }
            catch (e) {
                console.log(`Failed to load ${id}. Attempt threw:\n${e}\n`);
            }
        }
        return log;
    }

    /**
     * This method is used by the application to save the log of results for the given file synchronously.
     * @param filename {string} the name of the file to save.
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
     * @param runFileName {string} the name of the run file to retrieve.
     * @returns {string} the contents of the run file.
     * @throws Throws an error if the copy cannot be completed successfully.
     * @private
     */
    getRun(id) {
        const runfile = path.resolve(this.runsDirectory, id);
        var run;
        if (fs.existsSync(runfile)) {
            const contents = fs.readFileSync(runfile, 'utf8');
            try {
                run = JSON.parse(contents);
            }
            catch (e) {
                console.log(`Failed to load ${id}. Attempt threw:\n${e}\n`);
            }
        }
        return run;
    }

    /**
     * This method is used by the application to get an in-memory copy of all runs managed by
     * the plugin.
     * @returns {array} list of the run file.
     * @private
     */
    getRuns() {

        var runs = [];

        fs.readdirSync(this.runsDirectory).forEach(file => {
            if(file.substr(file.length-8) === 'run.json') {
                runs.push(file);
            }
        });

        return runs;
    }

    /**
     * This method saves record which is used by the client code to reference files for any particular run.
     * @param runId the unique ID of the run.
     * @param logName the name of the log file
     * @returns {{id: *, log: *, ruleset: (undefined|*|string), inputfilename: *, outputfilename: *, time: Date}}
     * @private
     */
    saveRunRecord(runId, logId, ruleSetId, inputFile, outputFile) {
        try {
            if (!fs.existsSync(this.runsDirectory))
                fs.mkdirSync(this.runsDirectory);	// Make sure the runsDirectory exists.
        }
        catch (e) {
            console.error(this.constructor.name + " failed to create \"" + this.runsDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
            throw e;
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

        return run;
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
