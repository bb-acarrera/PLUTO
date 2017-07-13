const pg = require('pg');

class DB {
    constructor(inConfig, onError) {
        let config = {
            user: inConfig.dbUser || 'pluto', //env var: PGUSER
            database: inConfig.dbDatabase || 'pluto', //env var: PGDATABASE
            password: inConfig.dbPassword || 'password', //env var: PGPASSWORD
            host: inConfig.dbHost || 'localhost', // Server hosting the postgres database
            port: inConfig.dbPort || 6543, //env var: PGPORT
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
            onError(err, client);
        });
    }

    query(text, values, callback) {
        return this.pool.query(text, values, callback);
    }

    connect(callback) {
        return this.pool.connect(callback);
    }
}

let dbInstance = null;

module.exports = (config) => {
    if(dbInstance) {
        return dbInstance;
    }

    if(config) {
        dbInstance = new DB(config);
    }

    return dbInstance;
};