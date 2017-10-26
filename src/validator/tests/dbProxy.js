const RuleSet = require("../../validator/RuleSet");

class DataProxy {
    constructor(ruleset, afterSave, done) {
        this.ruleset = ruleset;
        this.afterSave = afterSave;
        this.done = done || function() {};
    }

    getDataObj(config) {

        const that = this;

        return () => {
            return {
                retrieveRuleset: function() {
                    return new Promise((resolve, reject) => {

                        let ruleset;
                        if(typeof that.ruleset === "function") {
                            ruleset = that.ruleset(resolve, reject);
                        } else {
                            ruleset = that.ruleset;
                        }

                        resolve(new RuleSet(ruleset));
                    })
                },
                createRunRecord: function() {
                    return new Promise((resolve) => {
                        resolve(0);
                    })
                },
                saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile) {
                    return new Promise((resolve) => {

                        that.afterSave(runId, log, ruleSetID, inputFile, outputFile);

                        that.done();
                        resolve();
                    });
                },
                end: function () {}

            };
        };


    }
}

module.exports = DataProxy;
