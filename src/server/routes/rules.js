const fs = require('fs');
const path = require('path');

const BaseRouter = require('./baseRouter');

class RulesRouter extends BaseRouter {
	constructor(config) {
		super(config);

        this.rules = [];
        this.parsers = [];
        this.importers = [];
        this.exporters = [];

        this.classMap = {};

        this.loadManifests();
	}

    get(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.rules
        });
    }

	get_old(req, res) {
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

    loadManifests() {
        let dir = this.config.validator.config.rulesDirectory;


        this.loadManifest(dir);

        dir = path.resolve(__dirname, '../../rules');
        this.loadManifest(dir);

    }

    loadManifest(dir) {

        let manifestFile = dir;
        let manifest = null;

        try {
            manifestFile = path.resolve(dir, 'manifest.json');
            const contents = fs.readFileSync(manifestFile, 'utf8');

            manifest = JSON.parse(contents);

        } catch(e) {
            console.log('Error loading manifset from ' + manifestFile + ': ' + e);
            return;
        }

        if(manifest.rules) {
            manifest.rules.forEach((ruleItem) => {

                if(!this.classMap[ruleItem]) {
                    const ruleProperties = this.loadRuleFromManifest(dir, ruleItem.filename);

                    if(ruleProperties) {
                        this.rules.push(ruleProperties);
                    }
                }



            });
        }

    }

    loadRuleFromManifest(dir, file) {
        try {

            var ruleClass = null;

            const ruleFile = path.resolve(dir, file + '.js');

            if (fs.existsSync(ruleFile)) {

                ruleClass = require(ruleFile);

                this.classMap[file] = ruleClass;

                const uiConfig = {
                    properties: null
                }

                if(ruleClass.ConfigProperties) {

                    //do a deep clone

                    uiConfig.properties = JSON.parse(JSON.stringify(ruleClass.ConfigProperties));

                    if(ruleClass.ConfigDefaults) {
                        uiConfig.properties.forEach((prop) => {
                           if(ruleClass.ConfigDefaults.hasOwnProperty(prop.name)) {
                               prop.default = ruleClass.ConfigDefaults[prop.name];
                           }
                        });
                    }

                    return {
                        id: file,
                        type: 'rule',
                        attributes: {
                            name: file,
                            filename: file,
                            ui: uiConfig
                        }
                    };

                } else {
                    console.log(`Rule ${ruleFile} does not have ConfigProperties.`);
                }



            }
            else
                console.log(`No ${ruleFile} for ${file}.`);


        } catch (e) {
            console.log('Error loading rule ' + file + ' from manifest in ' + dir +': ' + e);
        }
        return null;
    }

}





module.exports = RulesRouter;
