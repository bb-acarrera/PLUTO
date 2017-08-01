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
		const rulesMap = {};
		let dir = this.config.validator.config.rulesDirectory;
		fs.readdirSync(dir).forEach(file => {
			let rule = this.loadRule(dir, file);
			if (rule) {
                rules.push(rule);
                rulesMap[rule.filename] = rule;
            }
		});

		dir = path.resolve(__dirname, '../../rules');
        fs.readdirSync(dir).forEach(file => {
            let rule = this.loadRule(dir, file);
            if (rule) {
            	if (!rulesMap[rule.filename])
                	rules.push(rule);
            }
        });

		res.json({
			data: rules
		});
	}

	loadRule(dir, file) {
        const extension = path.extname(file);
        if (extension && extension == ".js") {
            const basename = path.basename(file, extension);
            const uiConfigName = basename + ".ui.json";
            const configFile = path.resolve(dir, uiConfigName);
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

            return {
                id: basename,
                type: 'rule',
                attributes: {
                    name: basename,
                    filename: basename,
                    ui: uiConfig
                }
            };
        }
        return;
	}
}

module.exports = RulesRouter;
