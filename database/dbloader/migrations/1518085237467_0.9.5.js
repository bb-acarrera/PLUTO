exports.up = (pgm) => {

    pgm.createTable('errors',
        {
            message: { type : 'varchar(512)' },
            type: { type : 'varchar(512)' },
            time: { type : 'timestamp' }
        },
        {
            ifNotExists: true
        }
    );
};

exports.down = (pgm) => {
    pgm.dropTable('errors');
};
