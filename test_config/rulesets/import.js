const fs = require("fs");
const program = require("commander");
const path = require("path");
const pg = require('pg');

const version = '0.1';

class Importer {
    constructor(validatorConfig) {
        this.validatorConfig = validatorConfig;

        let inConfig = this.validatorConfig;

        let config = {
            user: inConfig.dbUser || 'pluto', //env var: PGUSER
            database: inConfig.dbDatabase || 'pluto', //env var: PGDATABASE
            password: inConfig.dbPassword || 'password', //env var: PGPASSWORD
            host: inConfig.dbHost || 'localhost', // Server hosting the postgres database
            port: inConfig.dbPort || 5432, //env var: PGPORT
            max: 10, // max number of clients in the pool
            idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
        };

        this.pool = new pg.Pool(config);

        this.pool.on('error', function (err, client) {
            // if an error is encountered by a client while it sits idle in the pool
            // the pool itself will emit an error event with both the error and
            // the client which emitted the original error
            // this is a rare occurrence but can happen if there is a network partition
            // between your application and the database, the database restarts, etc.
            // and so you might want to handle it and at least log it out
            console.error('idle client error', err.message, err.stack);


        });

    }

    query(text, values, callback) {
        return this.pool.query(text, values, callback);
    }

    run() {

        fs.readdirSync('.').forEach(file => {

            if(file.substr(file.length-5) === '.json') {

                let name = file.substr(0, file.length-5);

                let contents = null;

                try {
                    contents = require(path.resolve(file));
                }
                catch (e) {
                    console.log("Failed to load ruleset file \"" + file + "\".\n\t" + e);
                }

                if (!contents || !contents.ruleset) {
                    console.log("Ruleset file \"" + file + "\" does not contain a 'ruleset' member.");
                } else {
                    this.addRuleset(name, contents);
                }
            }
        });
    }

    addRuleset(name, ruleset) {
        this.query("SELECT id FROM rulesets WHERE ruleset_id = $1 AND version = 0", [name])
            .then((result) => {
                if(result.rows.length === 0) {
                   this.query("INSERT INTO rulesets (ruleset_id, name, version, rules) " +
                       "VALUES($1, $2, $3, $4) RETURNING id", [name, name, 0, JSON.stringify(ruleset)]);
                } else {
                   this.query("UPDATE rulesets SET rules = $2 WHERE id = $1", [result.rows[0].id, JSON.stringify(ruleset)])
                }

            })
            .catch((e) => {
                console.log('Error writing to database: ' + e.message);
            });
    }
}


let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the server or unit test? Only do the following if running as a server.
    program
        .version(version)
        .usage('[options]')
        .description('Import rulesets into the database from the ruleset folder. Must be run from the folder containing the rulesets')
        .option('-v, --validatorConfig <configFile>', 'The validator configuration file to use.')
        .option('-h, --host <hostname>', 'database server host')
        .option('-p, --port <port>', 'database server port')
        .option('-U, --username <username>', 'database user name')
        .option('-d, --dbname <database>', 'database to connect to')
        .option('-W, --password <password>', 'user password')
        .parse(process.argv);


    if (!program.validatorConfig && !program.host)
        program.help((text) => {
            return "A validator configuration file or database connection information must be specified.\n" + text;
        });

    let config = null;

    if(program.validatorConfig) {
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

    config.scriptName = scriptName;

    const importer = new Importer(config);
    importer.run();
}

module.exports = Importer;
