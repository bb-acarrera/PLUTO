const fs = require('fs');
const path = require('path');

const BaseRouter = require('./baseRouter');
const RuleLoader = require('../../common/ruleLoader');

class RulesRouter extends BaseRouter {
	constructor(config) {
		super(config);

        this.rulesLoader = new RuleLoader(this.config.validator.config.rulesDirectory);

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


}

module.exports = RulesRouter;
