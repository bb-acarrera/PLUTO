exports.up = (pgm) => {

    //have to drop the view in order to be able to alter the table
    pgm.sql('DROP VIEW "currentRuleset";');

    let textType = {
        type: 'text'
    };

    pgm.alterColumn('runs', 'run_id', textType);
    pgm.alterColumn('runs', 'inputfile', textType);
    pgm.alterColumn('runs', 'outputfile', textType);

    pgm.alterColumn('rulesets', 'ruleset_id', textType);
    pgm.alterColumn('rulesets', 'name', textType);

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
};

exports.down = (pgm) => {

    //have to drop the view in order to be able to alter the table
    pgm.sql('DROP VIEW "currentRuleset";');

    let varcharType = {
        type: 'varchar(512)'
    };

    pgm.alterColumn('runs', 'run_id', varcharType);
    pgm.alterColumn('runs', 'inputfile', varcharType);
    pgm.alterColumn('runs', 'outputfile', varcharType);

    pgm.alterColumn('rulesets', 'ruleset_id', varcharType);
    pgm.alterColumn('rulesets', 'name', varcharType);

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

};
