CREATE TABLE runs (
    id serial PRIMARY KEY,
    log_id integer,
    ruleset_id integer,
    run_id varchar(512),
    inputfile varchar(512),
    outputfile varchar(512),
    finishtime timestamp,
    log json
);

CREATE TABLE rulesets (
    id serial PRIMARY KEY,
    ruleset_id varchar(256),
    name varchar(256),
    version integer DEFAULT 0,
    rules json
)