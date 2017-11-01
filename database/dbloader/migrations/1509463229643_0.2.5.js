let rulesetColumns = {
	owner_user: {
		type: 'text'
	},
	owner_group: {
		type: 'text'
	},
	update_time: {
		type: 'timestamp'
	}
};

exports.up = (pgm) => {

	pgm.addColumns('rulesets', rulesetColumns );

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
		'    m.owner_user, '  +
		'    m.owner_group, '  +
		'    m.update_time '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');

};

exports.down = (pgm) => {

	pgm.sql('DROP VIEW "currentRuleset";');

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
		'    m.deleted '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');

	pgm.dropColumns('rulesets', rulesetColumns );


};
