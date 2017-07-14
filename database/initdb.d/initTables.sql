CREATE TABLE runs (
    id serial PRIMARY KEY,
    log_id integer,
    ruleset_id integer,
    run_id varchar(512),
    inputfile varchar(512),
    outputfile varchar(512),
    finishtime timestamp
);

CREATE TABLE logs (
    id serial PRIMARY KEY,
    log json
);

CREATE TABLE rulesets (
    id serial PRIMARY KEY,
    name varchar(256),
    version integer DEFAULT 0
)