const fs = require("fs");
const program = require("commander");
const path = require("path");
const DB = require('./db.js');
const child_process = require('child_process');


const version = '0.1';

class Configure {
    constructor(validatorConfig) {
        this.config = validatorConfig;


        this.db = new DB(this.config);
    }

    run() {



        this.db.testConnection().then(() => {
            this.checkSchema().then(() => {
                this.db.end();
                this.migrateDatabase();


            });
        });
    }

    checkSchema() {
         return new Promise((resolve) => {
             this.db.query("CREATE SCHEMA IF NOT EXISTS " + this.config.dbSchema)
                 .then(() => {
                     resolve();
                 })
                 .catch((e) => {
                     console.log('Error creating schema: ' + e.message);
                     resolve();
                 });
         });
    }

    migrateDatabase() {

        return new Promise((resolve, reject) => {
            const dbConfig = {
                user: this.config.dbUser,
                password: this.config.dbPassword,
                host: this.config.dbHost,
                port: this.config.dbPort,
                name: this.config.dbDatabase,
                schema: this.config.dbSchema
            };

            fs.writeFileSync('dbconfig.json', JSON.stringify(dbConfig), 'utf-8');

            const options = {
                cwd: path.resolve('.')
            };

            child_process.exec('npm bin', (error, stdout, stderr) => {

                if(error) {
                    console.log('Error getting npm bin: ' + error);
                    console.log(stderr);
                    reject(error);
                    return;
                }

                let binPath = path.resolve(stdout.trim());

                const spawnCmd = path.resolve(binPath + '/pg-migrate');

                const spawnExec = spawnCmd + ' up -f ./dbconfig.json';

                child_process.exec(spawnExec, (error, stdout, stderr) => {

                    if(error) {
                        console.log('Error getting npm bin: ' + error);
                        console.log(stderr);
                        reject(error);
                        return;
                    }

                    console.log(stderr);
                    console.log(stdout);

                    resolve();
                });

                /*

                let proc = child_process.spawn(spawnCmd, spawnArgs, options);

                proc.on('error', (err) => {
                    console.log("spawn error: " + err);
                    reject(err);
                });

                proc.stdout.on('data', (data) => {
                    console.log('stdout: ' + data.toString());

                });

                proc.stderr.on('data', (data) => {
                    console.log('stderr: ' + data.toString());
                });

                proc.on('exit', (code) => {
                    console.log('child process exited with code ' + code.toString());
                    resolve();
                });

                */

            });


        });


    }
}


let scriptName = process.argv[1];
if (__filename == scriptName) {	// Are we running this as the server or unit test? Only do the following if running as a server.
    program
        .version(version)
        .usage('[options]')
        .description('Set up and migrate the PLUTO database')
        .option('-v, --validatorConfig <configFile>', 'The validator configuration file to use.')
        .option('-h, --host <hostname>', 'database server host')
        .option('-p, --port <port>', 'database server port')
        .option('-U, --username <username>', 'database user name')
        .option('-d, --dbname <database>', 'database to connect to')
        .option('-W, --password <password>', 'user password')
        .option('-s, --schema <schema>', 'database schema')
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

    if(program.schema) {
        config.dbSchema = program.schema;
    } else if(!config.dbSchema) {
        config.dbSchema = 'pluto';
    }

    config.scriptName = scriptName;

    const configure = new Configure(config);

    configure.run();



}

module.exports = Configure;
