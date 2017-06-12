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
				const configName = basename + "Config.json";
				const configFile = path.resolve(this.config.validator.config.RulesDirectory, configName);
				var config = undefined;
				if (fs.existsSync(configFile)) {
					const contents = fs.readFileSync(configFile, 'utf8');
					try {
						config = JSON.parse(contents);
					}
					catch (e) {
						console.log(`Failed to load ${configName}. Attempt threw:\n${e}\n`);
					}
				}
				rules.push({
					id: basename,
					type: 'rule',
					attributes: {
						name: basename,
						filename: basename,
						config: config
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
