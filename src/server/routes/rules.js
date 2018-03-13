const BaseRouter = require('./baseRouter');
const RuleLoader = require('../../common/ruleLoader');
const RuleSet = require('../../validator/RuleSet');

class RulesRouter extends BaseRouter {
	constructor(config) {
		super(config);

        this.rulesLoader = this.config.rulesLoader;



        this.rulesetConfig = [{
            id: 0,
            type: 'rulesetconfigui',
            attributes: {
                name: null,
                filename: null,
                ui: {
                    properties: RuleLoader.applyDefaults(RuleSet.ConfigProperties, RuleSet.ConfigDefaults)
                }
            }
        }];

	}

    getRules(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.rulesLoader.rules
        });
    }

    getParsers(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.rulesLoader.parsers
        });
    }

    getImporters(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.rulesLoader.importers
        });
    }

    getExporters(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.rulesLoader.exporters
        });
    }

    getRulesetConfigUI(req, res) {

        res.json({
            data: this.rulesetConfig
        });
    }

    getReporters(req, res) {
        // Send reporters.

        res.json({
            data: this.rulesLoader.reporters
        });
    }

    getCustomFields(req, res) {
        // Send reporters.
        var fields = {
            "id": 0,
            "type": "customfield",
            "attributes": {
                "ui": {
                    "properties": this.config.validatorConfig.customValidationFields
                }
            }
        };
        res.json({
            data: fields
        });
    }

    getPeriodicity(req, res) {
        // Send reporters.
        var fields = {
            "id": 0,
            "type": "periodicity",
            "attributes": {
                "ui": {
                    "properties": [
                        {
                            name: 'frequency',
                            label: 'Expected update frequency: ',
                            type: 'choice',
                            choices: [
                                'Hourly',
                                'Daily',
                                'Weekly',
                                'Monthly',
                                'Quarterly',
                                'Annually'
                            ]
                        },
                        {
                            name: 'mustchange',
                            label: 'File is expected to change: ',
                            type: 'boolean'
                        }
                    ]
                }
            }
        };
        res.json({
            data: fields
        });
    }

}

module.exports = RulesRouter;
