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

    getPosttasks(req, res) {
        // Send reporters.

        res.json({
            data: this.rulesLoader.posttasks
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
            data: this.config.validatorConfig.customValidationFields ? fields : null
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

    getUiChoiceList(req, res, next) {

        let ruleId = req.params.ruleId;
        let propertyId = req.params.propertyId;

        let config = req.body.config;

        let rule = this.rulesLoader.apiEndpoints.choices[ruleId];

        if(!rule) {
            res.statusMessage = `Unable to retrieve ${ruleId} ${propertyId} `;
			res.status(404).end();
			return;
        }

        let prop = rule[propertyId];

        if(!prop) {
            res.statusMessage = `Unable to retrieve ${ruleId} ${propertyId} `;
			res.status(404).end();
			return;
        }

        Promise.resolve(prop.fn(config)).then((result) => {

            res.json({
                data: result
            })

        }, next).catch(next);
        
    }

}

module.exports = RulesRouter;
