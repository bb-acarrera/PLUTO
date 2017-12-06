let runColumns = {
	num_dropped: { type : 'integer' },
	summary: { type: 'jsonb' },
	passed: {
		type: 'boolean'
	}
};

exports.up = (pgm) => {
	pgm.addColumns('runs', runColumns );
};

exports.down = (pgm) => {
	pgm.dropColumns('runs', runColumns );
};
