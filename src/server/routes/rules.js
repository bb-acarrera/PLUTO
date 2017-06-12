const fs = require('fs');
const path = require('path');

const BaseRouter = require('./baseRouter');

class RulesRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res, next) {
		// Send generic rules. (i.e. not rule instances.)
		const rules = [];
		fs.readdirSync(this.config.validator.config.RulesDirectory).forEach(file => {
			const extension = path.extname(file);
			if (extension && extension == ".js") {
				const basename = path.basename(file, extension);
				rules.push({
					id: basename,
					type: 'rule',
					attributes: {
						name: basename,
						filename: basename,
						config: {}
					}
				});
			}
		});

		res.json({
			data: rules
		});
	}
}

module.exports = RulesRouter;
