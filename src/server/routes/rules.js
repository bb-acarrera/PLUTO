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

    getRules(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.rules
        });
    }

    getParsers(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.parsers
        });
    }

    getParsers(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.parsers
        });
    }

    getExporters(req, res) {
        // Send generic rules. (i.e. not rule instances.)

        res.json({
            data: this.exporters
        });
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

        let loadItem = (item, type, target) => {
            if(!this.classMap[item.filename]) {
                const properties = this.loadFromManifest(dir, item.filename, type);

                if(properties) {
                    target.push(properties);
                }
            }
        };

        if(manifest.rules) {
            manifest.rules.forEach((item) => {
                loadItem(item, 'rule', this.rules);
            });
        }

        if(manifest.parsers) {
            manifest.parsers.forEach((item) => {
                loadItem(item, 'parser', this.parsers);
            });
        }

        if(manifest.importers) {
            manifest.importers.forEach((item) => {
                loadItem(item, 'importer', this.importers);
            });
        }

        if(manifest.exporters) {
            manifest.exporters.forEach((item) => {
                loadItem(item, 'exporter', this.exporters);
            });
        }

    }

    loadFromManifest(dir, file, type) {
        try {

            var ruleClass = null;

            const ruleFile = path.resolve(dir, file + '.js');

            if (fs.existsSync(ruleFile)) {

                ruleClass = require(ruleFile);

                this.classMap[file] = ruleClass;

                var properties = this.getClassProperties(ruleClass);
                if(properties) {

                    return {
                        id: file,
                        type: type,
                        attributes: {
                            name: file,
                            filename: file,
                            ui: {
                                properties: properties
                            }
                        }
                    };

                } else {
                    console.log(`${type} ${ruleFile} does not have ConfigProperties.`);
                }
            }
            else
                console.log(`No ${ruleFile} for ${type} ${file}.`);


        } catch (e) {
            console.log(`Error loading ${type} ${file} from manifest in ${dir}: ${e}`);
        }
        return null;
    }

    getClassProperties(ruleClass) {

        if(ruleClass.ConfigProperties) {
            //do a deep clone
            let properties = JSON.parse(JSON.stringify(ruleClass.ConfigProperties));

            if (ruleClass.ConfigDefaults) {
                properties.forEach((prop) => {
                    if (ruleClass.ConfigDefaults.hasOwnProperty(prop.name)) {
                        prop.default = ruleClass.ConfigDefaults[prop.name];
                    }
                });
            }
            return properties;
        }
        return null;
    }

}





module.exports = RulesRouter;
