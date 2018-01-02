exports.up = (pgm) => {

	pgm.dropConstraint('rulesets', 'ruleset_sourceFile_version', {ifExists: true});

	pgm.sql('CREATE EXTENSION IF NOT EXISTS btree_gist;');

	pgm.addConstraint('rulesets', 'ruleset_targetFile_ruleset_id',
		'EXCLUDE USING gist (target_file WITH =, ruleset_id WITH <>) WHERE (target_file IS NOT NULL)'
	);
};

exports.down = (pgm) => {

	pgm.dropConstraint('rulesets', 'ruleset_targetFile_ruleset_id', {ifExists: true});

	pgm.addConstraint('rulesets', 'ruleset_sourceFile_version', 'UNIQUE (target_file, version)');
};
