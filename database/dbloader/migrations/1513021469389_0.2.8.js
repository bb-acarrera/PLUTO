let newRulesetColumns = {
	target_file: { type : 'text' }
};

let rulesetDelColumns = {
	group: {
		type: 'text'
	}
};

exports.up = (pgm) => {

	pgm.sql('DROP VIEW "currentRuleset";');

	pgm.addColumns('rulesets', newRulesetColumns );

	pgm.addConstraint('rulesets', 'ruleset_sourceFile_version', 'UNIQUE (target_file, version)');

	pgm.dropColumns('rulesets', rulesetDelColumns );

	pgm.sql(
		'CREATE OR REPLACE VIEW "currentRuleset" AS ' +
		'WITH current_ver AS (' +
		'    SELECT rulesets.ruleset_id,' +
		'    max(rulesets.version) AS version ' +
		'FROM rulesets ' +
		'GROUP BY rulesets.ruleset_id' +
		') ' +
		'SELECT m.id,' +
		'    m.ruleset_id,' +
		'    m.name,' +
		'    m.version,' +
		'    m.rules,' +
		'    m.deleted, '  +
		'    m.update_user, '  +
		'    m.owner_group, '  +
		'    m.update_time, '  +
		'    m.target_file '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');

};

exports.down = (pgm) => {

	pgm.sql('DROP VIEW "currentRuleset";');

	pgm.addColumns('rulesets', rulesetDelColumns );

	pgm.dropConstraint('rulesets', 'ruleset_sourceFile_version', {ifExists:true});

	pgm.dropColumns('rulesets', newRulesetColumns );

	pgm.sql(
		'CREATE OR REPLACE VIEW "currentRuleset" AS ' +
		'WITH current_ver AS (' +
		'    SELECT rulesets.ruleset_id,' +
		'    max(rulesets.version) AS version ' +
		'FROM rulesets ' +
		'GROUP BY rulesets.ruleset_id' +
		') ' +
		'SELECT m.id,' +
		'    m.ruleset_id,' +
		'    m.name,' +
		'    m.version,' +
		'    m.rules,' +
		'    m.deleted, '  +
		'    m.update_user, '  +
		'    m.owner_group, '  +
		'    m.update_time, '  +
		'    m.group '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');
};
