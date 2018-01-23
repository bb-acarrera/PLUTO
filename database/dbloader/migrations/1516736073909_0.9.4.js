let runColumns = {
	source_id: { type : 'integer' },
	target_id: { type : 'integer' },
};

exports.up = (pgm) => {
	pgm.addColumns('runs', runColumns );
};

exports.down = (pgm) => {
	pgm.dropColumns('runs', runColumns );
};

