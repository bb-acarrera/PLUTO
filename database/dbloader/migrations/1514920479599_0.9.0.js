exports.up = (pgm) => {

	pgm.dropConstraint('rulesets', 'ruleset_sourceFile_version', {ifExists: true});

	pgm.sql('CREATE EXTENSION IF NOT EXISTS btree_gist;');

	pgm.addConstraint('rulesets', 'ruleset_targetFile_ruleset_id',
		'EXCLUDE USING gist (target_file WITH =, ruleset_id WITH <>) WHERE (target_file IS NOT NULL AND deleted = FALSE)'
	);

	pgm.addConstraint('runs', 'FK_ruleset_id_ruleset_id',
		'FOREIGN KEY (ruleset_id) REFERENCES rulesets (id) ON DELETE RESTRICT NOT VALID'
	);
};

exports.down = (pgm) => {

	pgm.dropConstraint('rulesets', 'ruleset_targetFile_ruleset_id', {ifExists: true});

	pgm.dropConstraint('rulesets', 'FK_ruleset_id_ruleset_id', {ifExists: true});

	// this was a bad constraint and downgrading may be impossible, so going to not include but leave
	//   here as a reference to why
	//pgm.addConstraint('rulesets', 'ruleset_sourceFile_version', 'UNIQUE (target_file, version)');
};
