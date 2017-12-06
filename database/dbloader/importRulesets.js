const fs = require("fs");
const program = require("commander");
const path = require("path");
const pg = require('pg');
const DB = require('./db.js');

const version = '0.1';

class Importer {
	constructor(validatorConfig, rulesetFolder) {
		this.config = validatorConfig;
		this.rulesetFolder = rulesetFolder;

		let schemaName = validatorConfig.dbSchema;
		if (!schemaName) {
			schemaName = 'pluto';
		}
		if (schemaName.length > 0) {
			schemaName = schemaName + '.';
		}

		this.rulesetsTable = schemaName + 'rulesets';
		this.rulesTable = schemaName + 'rules';

		this.db = new DB(this.config);
	}


	run() {

		this.db.testConnection().then(() => {
			this.processFolder();
		});
	}


	processFolder() {

		let promises = [];

		fs.readdirSync(this.rulesetFolder).forEach(file => {

			if (file.substr(file.length - 5) === '.json') {

				let contents = null;

				try {
					contents = require(path.resolve(this.rulesetFolder, file));
				}
				catch (e) {
					console.log("Failed to load file \"" + file + "\" as json.\n\t" + e);
				}

				if (contents && contents.ruleset) {
					let name = file.substr(0, file.length - 5);
					promises.push(this.addRuleset(name, contents.ruleset, file));
				} else if (contents && Array.isArray(contents.rules)) {
					promises.push(this.addRules(contents.rules, file));
				} else {
					console.log("File \"" + file + "\" does not contain a proper 'ruleset' or 'rules' member.");
				}
			}
		});

		Promise.all(promises).then(() => {
			this.db.end();
		});
	}

	addRuleset(name, ruleset, file) {

		return new Promise((resolve) => {
			this.db.query("SELECT version FROM " + this.rulesetsTable + " WHERE ruleset_id = $1 ORDER BY version DESC", [name])
				.then((result) => {
					if (result.rows.length === 0) {
						this.db.query("INSERT INTO " + this.rulesetsTable + " (ruleset_id, name, version, rules) " +
								"VALUES($1, $2, $3, $4) RETURNING id",
							[name, ruleset.name || name, 0, JSON.stringify(ruleset)])
							.then(() => {
								console.log('Inserted ' + file);
								resolve();
							});

					} else if (this.config.forceWrite) {

						const version = result.rows[0].version + 1;

						this.db.query("INSERT INTO " + this.rulesetsTable + " (ruleset_id, name, version, rules) " +
								"VALUES($1, $2, $3, $4) RETURNING id",
							[name, ruleset.name || name, version, JSON.stringify(ruleset)])
							.then(() => {
								console.log('Updated ' + file);
								resolve();
							});
					} else {
						console.log(file + ' already in database');
						resolve();
					}

				})
				.catch((e) => {
					console.log('Error writing to database: ' + e.message);
					resolve();
				});
		});


	}

	addRules(rules, file) {
		return new Promise((resolve) => {
			let promises = [];

			rules.forEach((rule) => {
				promises.push(this.addRule(rule, file));
			});

			Promise.all(promises).then(() => {
				resolve();
			}).catch((e) => {
				console.log(`Error adding rules from ${file}: ${e}`);
				resolve();
			});

		});
	}

	addRule(rule, file) {
		return new Promise((resolve) => {
			this.db.query("SELECT version FROM " + this.rulesTable + " WHERE rule_id = $1 ORDER BY version DESC", [rule.rule_id])
				.then((result) => {

					if (result.rows.length === 0 || this.config.forceWrite) {

						let version = 0;
						let update = false;

						if (result.rows.length > 0 && this.config.forceWrite) {
							const version = result.rows[0].version + 1;
							update = true;
						}

						this.db.query("INSERT INTO " + this.rulesTable + ' (rule_id, description, version, config, type, base, "group") ' +
								"VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
							[rule.rule_id, rule.description, version, JSON.stringify(rule.config), rule.type, rule.base, rule.group])
							.then(() => {

								if (update) {
									console.log('Updated rule ' + rule.rule_id + ' from ' + file);
								} else {
									console.log('Inserted rule ' + rule.rule_id + ' from ' + file);
								}

								resolve();
							});
					} else {
						console.log(rule.rule_id + ' from ' + file + ' already in database');
						resolve();
					}

				})
				.catch((e) => {
					console.log('Error writing to database: ' + e.message);
					resolve();
				});
		});
	}

	exportTable(tableName) {
		this.db.query("SELECT * FROM " + tableName, []).then((results) => {
			console.log(JSON.stringify(results.rows));
			process.exit(0);
		});
	}

}


let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the server or unit test? Only do the following if running as a server.
	program
		.version(version)
		.usage('[options]')
		.description('Import rulesets into the database from the ruleset folder. Default assumes run from the folder containing the rulesets')
		.option('-v, --validatorConfig <configFile>', 'The validator configuration file to use.')
		.option('-h, --host <hostname>', 'database server host')
		.option('-p, --port <port>', 'database server port')
		.option('-U, --username <username>', 'database user name')
		.option('-d, --dbname <database>', 'database to connect to')
		.option('-W, --password <password>', 'user password')
		.option('-e, --export <tablename>', 'table name to export')
		.option('-s, --schema <schema>', 'database schema')
		.option('-r, --ruleset <rulesetFolder>', 'folder that contains the rulesets and rules, default current folder')
		.option('-f, --force', 'force overwrite of rulesets if present')
		.parse(process.argv);


	if (!program.validatorConfig && !program.host)
		program.help((text) => {
			return "A validator configuration file or database connection information must be specified.\n" + text;
		});

	let config = null;

	if (program.validatorConfig) {
		let validatorConfigPath = path.resolve(program.validatorConfig);

		if (!fs.existsSync(validatorConfigPath)) {
			console.log("Failed to find validator configuration file \"" + validatorConfigPath + "\".\n");
			process.exit(1);
		}

		config = require(validatorConfigPath);

	} else {
		config = {
			dbUser: program.username,
			dbDatabase: program.dbname,
			dbPassword: program.password,
			dbHost: program.host,
			dbPort: program.port
		}
	}

	if (program.schema) {
		config.dbSchema = program.schema;
	} else if (!config.dbSchema) {
		config.dbSchema = 'pluto';
	}

	let rulesetFolder;

	if (program.ruleset) {
		rulesetFolder = path.resolve(program.ruleset);
	} else if (config.rulesetDirectory) {
		rulesetFolder = path.resolve(config.rootDirectory, config.rulesetDirectory);
	} else {
		rulesetFolder = path.resolve('.');
	}


	config.scriptName = scriptName;

	config.forceWrite = program.force;

	const importer = new Importer(config, rulesetFolder);

	if (program.export) {
		importer.exportTable(program.export);
	} else {
		importer.run();
	}


}

module.exports = Importer;
