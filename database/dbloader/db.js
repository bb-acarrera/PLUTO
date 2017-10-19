const fs = require("fs");
const program = require("commander");
const path = require("path");
const pg = require('pg');

class DB {
    constructor(inConfig) {

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

        this.dbConfig = config;
    }

    end() {
        this.pool.end();
    }

    query(text, values, callback) {
        return this.pool.query(text, values, callback);
    }


    testConnection() {

        this.failureCount = 0;

        console.log("Attempting to connect to database");

        let doTest = (resolve) => {
            let client = new pg.Client(this.dbConfig);
            client.on('error', function (err, client) {
                //console.error('Attempted failed: ', err.message);
            });

            client.connect()
                .then(() => {
                    client.end();
                    resolve();
                }).catch(e => {
                this.failureCount += 1;

                if(this.failureCount > 15) {
                    console.error('Too manny connection attempts; aborting');
                    process.exit(1);
                }

                client.end();
                console.error('Attempt failed: ', e.message);
                setTimeout(() => {
                    doTest(resolve);
                }, 2000);
            });
        };


        return new Promise((resolve) => {
            doTest(resolve);
        });


    }
}

module.exports = DB;