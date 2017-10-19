#!/bin/sh

echo Must be run from PLUTO root dir

docker volume create devpgdata
docker run -v devpgdata:/var/lib/postgresql/data -p 6543:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_USER=pluto -e POSTGRES_DB=pluto --name dev_database -d postgres:9.6-alpine

cd database/dbloader

node configureDatabase.js -v ../../src/runtime/configs/validatorConfig.json
node importRulesets.js -v ../../src/runtime/configs/validatorConfig.json -r ../../src/runtime/rulesets