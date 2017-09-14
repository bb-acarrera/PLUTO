const fs = require('fs');
const path = require('path');

class RuleLoader {

    constructor(customRulePath) {
        this.customRulesPath = customRulePath;

        this.rules = [];
        this.parsers = [];
        this.importers = [];
        this.exporters = [];

        this.rulesMap = {};
        this.parsersMap = {};
        this.importersMap = {};
        this.exportersMap = {};

        this.classMap = {};

        this.loadManifests();
    }


    loadManifests() {
        let dir = this.customRulesPath;


        this.loadManifest(dir);

        dir = path.resolve(__dirname, '../rules');
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

        let loadItem = (item, type, target, map) => {
            if(!this.classMap[item.filename]) {
                const properties = this.loadFromManifest(dir, item, type);

                if(properties) {
                    target.push(properties);
                    map[item.filename] = this.classMap[item.filename];
                }
            }
        };

        if(manifest.rules) {
            manifest.rules.forEach((item) => {
                loadItem(item, 'rule', this.rules, this.rulesMap);
            });
        }

        if(manifest.parsers) {
            manifest.parsers.forEach((item) => {
                loadItem(item, 'parser', this.parsers, this.parsersMap);
            });
        }

        if(manifest.importers) {
            manifest.importers.forEach((item) => {
                loadItem(item, 'importer', this.importers, this.importersMap);
            });
        }

        if(manifest.exporters) {
            manifest.exporters.forEach((item) => {
                loadItem(item, 'exporter', this.exporters, this.exportersMap);
            });
        }

    }

    loadFromManifest(dir, item, type) {

        try {

            let file = item.filename;
            let ruleFile;

            if(item.path) {
                ruleFile = path.resolve(dir, item.path);
            } else {
                ruleFile = path.resolve(dir, file + '.js');
            }

            var ruleClass = null;

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

module.exports = RuleLoader;