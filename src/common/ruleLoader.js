const fs = require('fs');
const path = require('path');

class RuleLoader {

	constructor(customRulePath, database) {
		this.customRulesPath = customRulePath;
		this.db = database;

		this.rules = [];
		this.parsers = [];
		this.importers = [];
		this.exporters = [];
		this.reporters = [];
		this.posttasks = [];

		this.rulesMap = {};
		this.parsersMap = {};
		this.importersMap = {};
		this.exportersMap = {};
		this.reportersMap = {};
		this.posttasksMap = {};

		this.rulePropertiesMap = {};
		this.classMap = {};
		this.apiEndpoints = {
			choices: {}
		};

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

		} catch (e) {
			console.log('Error loading manifest from ' + manifestFile + ': ' + e);
			return;
		}

		let loadItem = (item, type, target, map) => {
			if (!this.classMap[item.filename]) {
				const properties = this.loadFromManifest(dir, item, type);

				if (properties) {
					target.push(properties);
					map[item.filename] = this.classMap[item.filename];
					this.rulePropertiesMap[item.filename] = properties;
				}
			}
		};

		if (manifest.rules) {
			manifest.rules.forEach((item) => {
				loadItem(item, 'rule', this.rules, this.rulesMap);
			});
		}

		if (manifest.parsers) {
			manifest.parsers.forEach((item) => {
				loadItem(item, 'parser', this.parsers, this.parsersMap);
			});
		}

		if (manifest.importers) {
			manifest.importers.forEach((item) => {
				loadItem(item, 'importer', this.importers, this.importersMap);
			});
		}

		if (manifest.exporters) {
			manifest.exporters.forEach((item) => {
				loadItem(item, 'exporter', this.exporters, this.exportersMap);
			});
		}

		if (manifest.reporters) {
			manifest.reporters.forEach((item) => {
				loadItem(item, 'reporter', this.reporters, this.reportersMap);
			});
		}

		if (manifest.posttasks) {
			manifest.posttasks.forEach((item) => {
				loadItem(item, 'posttask', this.posttasks, this.posttasksMap);
			});
		}

	}

	loadFromManifest(dir, item, type) {

		let file, suffixedFile, executable, shortDescription, longDescription, title, requiredParser;
		let types = [];

		try {
			executable = item.executable;
			file = item.filename;

			suffixedFile = file;
			if (!executable && !suffixedFile.endsWith('.js'))
				suffixedFile = suffixedFile + '.js';

			let ruleFile, script;

			if (executable) {
				ruleFile = "../rules/RunExternalProcess.js";
				if (item.script) {
					script = path.resolve(dir, item.script);
				}
			}
			else if (item.path) {
				ruleFile = path.resolve(dir, item.path);
			} else {
				ruleFile = path.resolve(dir, suffixedFile);
			}

			var ruleClass = require(ruleFile);
			this.classMap[file] = ruleClass;

			types.push(file);

			var descriptions = RuleLoader.getClassDescriptions(ruleClass);
			if (descriptions && descriptions.shortDescription)
				shortDescription = descriptions.shortDescription;
			if (descriptions && descriptions.longDescription)
				longDescription = descriptions.longDescription;
			if (descriptions && descriptions.title)
				title = descriptions.title;

			if(ruleClass.Parser) {
				requiredParser = ruleClass.Parser;
			}

			if(ruleClass.Type) {

				if(Array.isArray(ruleClass.Type)) {
					types = types.concat(ruleClass.Type);
				} else {
					types.push(ruleClass.Type);
				}


			}

			// A description in the manifest takes precedence over one in the file (allows for localization/internationalization).
			// ??? Might want this after the script descriptions are loaded to allow replacing them with local descriptions too.
			if (item.shortDescription) {
				shortDescription = item.shortDescription;
			}

			if (item.longDescription) {
				longDescription = item.longDescription;
			}

			if (item.title) {
				title = item.title;
			}
			
			var properties = RuleLoader.getClassProperties(ruleClass);

			if (item.ui) {
				// For executables without scripts their UI must be defined in the manifest.
				properties = properties || [];
				if (item.ui instanceof Array)
					properties = properties.concat(item.ui);
				else
					properties.append(item.ui);
			}

			let extDir = path.dirname(ruleFile);


			if (script) {

				extDir = path.dirname(script);

				// Scripts, not being JavaScript, need an external UI description file.
				var moreProperties = RuleLoader.getJSONProperties(script);
				var changeFileFormat;
				if (moreProperties) {

					properties = properties || [];
					if (moreProperties instanceof Array) {
						var propsToDelete = [];
						for (var i = 0; i < moreProperties.length; i++) {
							if (moreProperties[i].shortdescription != null) {
								shortDescription = moreProperties[i].shortdescription;
								delete moreProperties[i].shortdescription;
							}
							if (moreProperties[i].longdescription != null) {
								longDescription = moreProperties[i].longdescription;
								delete moreProperties[i].longdescription;
							}
							if (moreProperties[i].title != null) {
								title = moreProperties[i].title;
								delete moreProperties[i].title;
							}
							if (moreProperties[i].changeFileFormat != null) {
								changeFileFormat = moreProperties[i].changeFileFormat;
								delete moreProperties[i].changeFileFormat;
							}

							if (moreProperties[i].parser != null) {
								requiredParser = moreProperties[i].parser;
								delete moreProperties[i].parser;
							}

							if (Object.keys(moreProperties[i]).length == 0 ||
								(!moreProperties[i].name || !moreProperties[i].type)) //not an actual config property
								propsToDelete.push(i);	// Remember this element. It's empty so we'll need to delete it.

						}

						if (propsToDelete.length > 0) {
							// Delete empty elements.
							for (var i = propsToDelete.length - 1; i >= 0; i--)
								moreProperties.splice(propsToDelete[i], 1);
						}
						properties = moreProperties.concat(properties);
					}
					else {
						if (moreProperties.shortdescription) {
							shortDescription = moreProperties.shortdescription;
							delete moreProperties.shortdescription;
						}
						if (moreProperties.longdescription) {
							longDescription = moreProperties.longdescription;
							delete moreProperties.longdescription;
						}
						if (moreProperties.title) {
							title = moreProperties.title;
							delete moreProperties.title;
						}
						if (moreProperties.changeFileFormat != null) {
							changeFileFormat =moreProperties.changeFileFormat;
							delete moreProperties.changeFileFormat;
						}
						if (moreProperties.parser != null) {
							requiredParser = moreProperties.parser;
							delete moreProperties.parser;
						}

						if (Object.keys(moreProperties).length > 0)
							properties.push(moreProperties);
					}
				}
			} 

			if (properties) {

				
				//check for api calls
				properties.forEach((prop) => {

					if(prop.choicesFunction) {
						
						let fileObj = this.apiEndpoints.choices[file];
						if(!fileObj) {
							fileObj = {};
							this.apiEndpoints.choices[file] = fileObj;
						}

						let fn = null;

						if(typeof prop.choicesFunction == 'function') {
							fn = prop.choicesFunction
						} else if(prop.choicesFile) {
							try {
								let jsFile = require(path.resolve(extDir, prop.choicesFile));

								fn = jsFile[prop.choicesFunction];

							} catch(e) {
								console.log(`Unable to load choices api function for ${file} ${prop.name}`);
							}
						} else {
							console.log(`Unable to load choices api function for ${file} ${prop.name}`);
						}

						if(fn) {
							fileObj[prop.name] = { fn: fn };
							prop.choicesAPI = `${file}/${prop.name}`;
						}
						
						delete prop.choicesFunction;
						if(prop.choicesFile) {
							delete prop.choicesFile;
						}
						

					}

				});

				return {
					id: file,
					type: type,
					attributes: {
						name: file,
						filename: file,
						path: item.path,
						script: script,
						executable: executable,
						ui: {
							properties: properties
						},
						shortdescription: shortDescription,
						longdescription: longDescription,
						title: title,
						changeFileFormat: changeFileFormat,
						requiredParser: requiredParser,
						types: types
					}
				};

			} else {
				console.log(`${type} ${ruleFile} does not have ConfigProperties.`);
			}

		} catch (e) {
			console.log(`Error loading ${type} ${file} from manifest in ${dir}: ${e}`);
		}
		return null;
	}

	getDbRule(id, group, admin) {

		return new Promise((resolve) => {
			if (!this.db) {
				resolve(null);
				return;
			}

			this.db.retrieveRule(id, undefined, undefined, group, admin, this).then((rule) => {
				resolve(rule);
			}, () => {
				resolve(null);
			})
		});
	}

	static getJSONProperties(ruleFile) {
		// Load ui properties from a companion JSON file. This allows the plug-in developer to add properties without
		// requiring the manifest maintainer to do anything special when adding the plug-in.
		let jsonFile = ruleFile + '.json';
		if (fs.existsSync(jsonFile)) {
			try {
				const contents = fs.readFileSync(jsonFile, 'utf8');
				return JSON.parse(contents);
			} catch (e) {
				console.log('Error loading JSON from ' + jsonFile + ': ' + e);
				return;
			}
		}
		return;
	}

	static getClassDescriptions(ruleClass) {

		if (ruleClass.Descriptions) {
			return ruleClass.Descriptions;
		}
		return null;
	}

	static getClassProperties(ruleClass) {

		if (ruleClass.ConfigProperties) {
			//do a deep clone
			let properties = JSON.parse(JSON.stringify(ruleClass.ConfigProperties));

			this.applyDefaults(properties, ruleClass.ConfigDefaults);

			return properties;
		}
		return null;
	}

	static applyDefaults(properties, configDefaults) {

		if (!configDefaults) {
			return;
		}

		properties.forEach((prop) => {
			if (configDefaults.hasOwnProperty(prop.name)) {
				prop.default = configDefaults[prop.name];
			}
		});

		return properties;
	}

}

module.exports = RuleLoader;