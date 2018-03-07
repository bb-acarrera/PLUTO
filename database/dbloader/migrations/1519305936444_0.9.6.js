let runsColumns = {
    request_user: {
        type: 'string'
    },
    request_group: {
        type: 'string'
    }
};


exports.up = (pgm) => {
    pgm.addColumns('runs', runsColumns );
};

exports.down = (pgm) => {
    pgm.dropColumns('runs', runsColumns );
};
