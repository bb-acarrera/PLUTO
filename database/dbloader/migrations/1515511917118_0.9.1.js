let runColumns = {
	input_md5: { type : 'string' }
};

exports.up = (pgm) => {
	pgm.addColumns('runs', runColumns );
};

exports.down = (pgm) => {
	pgm.dropColumns('runs', runColumns );
};

