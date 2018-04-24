const RuleSet = require("../../validator/RuleSet");

class DataProxy {
    constructor(ruleset, afterSave, done, fns) {
        this.ruleset = ruleset;
        this.afterSave = afterSave;
        this.done = done || function() {};
        this.fns = fns || {};
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
                saveRunRecord: function(runId, log, ruleSetID, inputFile, outputFile, logCounts, passed, summary, hash, finished) {
                    return new Promise((resolve) => {

                        if(!that.fns.saveRunRecord || !that.fns.saveRunRecord(runId, log, ruleSetID, inputFile, outputFile, logCounts, passed, summary, hash, finished)) {
                            if(that.afterSave && finished) {

                                try {
                                    that.afterSave(runId, log, ruleSetID, inputFile, outputFile, logCounts, passed, summary, hash, finished);
                                   
                                } catch(e) {
                                    console.log('Exception in aferSave function: ' + e);
                                }
                                
                                that.done();
                            }
                        }

                        resolve();
                    });
                },

                getRuns: function(page, size, filters = {}, orderBy) {
                    return new Promise((resolve) => {

                        let result;

                        if(that.fns.getRuns) {
                            result = that.fns.getRuns(page, size, filters, orderBy);
                        }

                        if(!result) {
                            result = {
                                runs: [],
                                rowCount: 0,
                                pageCount: 0
                            }
                        }

                        resolve(result);
                    });
                },

                end: function () {}



            };
        };


    }
}

module.exports = DataProxy;
