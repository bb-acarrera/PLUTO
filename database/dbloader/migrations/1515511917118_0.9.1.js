let newRulesetColumns = {
	source_file: { type : 'text' }
};

exports.up = (pgm) => {
	pgm.sql('DROP VIEW "currentRuleset";');

	pgm.addColumns('rulesets', newRulesetColumns );



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
		'    m.target_file, '  +
		'    m.source_file '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');
};

exports.down = (pgm) => {
	pgm.sql('DROP VIEW "currentRuleset";');

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
		'    m.target_file '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');
};
