exports.up = (pgm) => {
    pgm.createTable('runs',
        {
            id: { type: 'serial', primaryKey : true },
            log_id: { type : 'integer' },
            ruleset_id: { type : 'integer' },
            run_id: { type : 'varchar(512)' },
            inputfile: { type : 'varchar(512)' },
            outputfile: { type : 'varchar(512)' },
            starttime: { type : 'timestamp' },
            finishtime: { type : 'timestamp' },
            log: { type : 'json' },
            num_errors: { type : 'integer' },
            num_warnings: { type : 'integer' }
        },
        {
            ifNotExists: true
        }
    );

    pgm.createTable('rulesets',
        {
            id: { type: 'serial', primaryKey : true },
            ruleset_id: { type : 'varchar(512)' },
            name: { type : 'varchar(512)' },
            version: { type : 'integer', default: '0' },
            rules: { type : 'json' }
        },
        {
            ifNotExists: true
        }
    );

    pgm.createTable('errors',
        {
            id: { type: 'serial', primaryKey : true },
            message: { type : 'varchar(512)' },
            message: { type : 'integer', default: '0' },
            time: { type : 'timestamp' }
        },
        {
            ifNotExists: true
        }
    );
};

exports.down = false;
