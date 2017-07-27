const fs = require('fs');
const path = require('path');

const BaseRouter = require('./baseRouter');

class RulesRouter extends BaseRouter {
	constructor(config) {
		super(config);
	}

	get(req, res) {
		// Send generic rules. (i.e. not rule instances.)
		const rules = [];
		fs.readdirSync(this.config.validator.config.rulesDirectory).forEach(file => {
			const extension = path.extname(file);
			if (extension && extension == ".js") {
				const basename = path.basename(file, extension);
				const uiConfigName = basename + ".ui.json";
				const configFile = path.resolve(this.config.validator.config.rulesDirectory, uiConfigName);
				var uiConfig = undefined;
				if (fs.existsSync(configFile)) {
					const contents = fs.readFileSync(configFile, 'utf8');
					try {
						uiConfig = JSON.parse(contents);
					}
					catch (e) {
						console.log(`Failed to load ${uiConfigName}. Attempt threw:\n${e}\n`);
					}
				}
				else
					console.log(`No ${uiConfigName} for ${file}.`);
				
				rules.push({
					id: basename,
					type: 'rule',
					attributes: {
						name: basename,
						filename: basename,
						ui: uiConfig
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
