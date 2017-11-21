let rulesetColumns = {
	group: {
		type: 'text'
	}
};

exports.up = (pgm) => {
	pgm.createTable('rules',
		{
			id: { type: 'serial', primaryKey : true },
			rule_id: { type : 'text' },
			description: { type : 'text' },
			type:  { type : 'text' },
			base: { type : 'text' },
			group: { type : 'text' },
			config: { type : 'json' },
			version: { type : 'integer', default: '0' },
			deleted: { type: 'boolean', default: 'FALSE' },
			update_user: { type: 'text' },
			owner_group: { type: 'text' },
			update_time: { type: 'timestamp' }
		},
		{
			ifNotExists: true
		}
	);

	pgm.addConstraint('rules', 'rule_id_version', 'UNIQUE (rule_id, version)');

	pgm.sql(
		'CREATE OR REPLACE VIEW "currentRule" AS ' +
		'WITH current_ver AS (' +
		'    SELECT rules.rule_id,' +
		'    max(rules.version) AS version ' +
		'FROM rules ' +
		'GROUP BY rules.rule_id' +
		') ' +
		'SELECT m.id,' +
		'    m.rule_id,' +
		'    m.description,' +
		'    m.type,' +
		'    m.base,' +
		'    m.group,' +
		'    m.config,' +
		'    m.version,' +
		'    m.deleted, '  +
		'    m.update_user, '  +
		'    m.owner_group, '  +
		'    m.update_time '  +
		'FROM rules m ' +
		'JOIN current_ver c ON c.rule_id::text = m.rule_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');


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
		'    m.update_user, '  +
		'    m.owner_group, '  +
		'    m.update_time, '  +
		'    m.group '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');
};

exports.down = (pgm) => {

	pgm.sql('DROP VIEW "currentRule";');

	pgm.dropConstraint('rulesets', 'ruleset_id_version', {ifExists:true});

	pgm.dropTable('rules');

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
		'    m.deleted, '  +
		'    m.update_user, '  +
		'    m.owner_group, '  +
		'    m.update_time '  +
		'FROM rulesets m ' +
		'JOIN current_ver c ON c.ruleset_id::text = m.ruleset_id::text AND c.version = m.version ' +
		'WHERE m.deleted = false;');

	pgm.dropColumns('rulesets', rulesetColumns );

};
