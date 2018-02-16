#!/bin/sh

echo Must be run from PLUTO root dir

cd src/runtime/configs

POSTGRES_PORT=$(node -pe "require('./validatorConfig.json').dbPort")
POSTGRES_USER=$(node -pe "require('./validatorConfig.json').dbUser")
POSTGRES_PASSWORD=$(node -pe "require('./validatorConfig.json').dbPassword")
POSTGRES_DATABASE=$(node -pe "require('./validatorConfig.json').dbDatabase")

cd ../../..

docker volume create devpgdata

docker stop dev_database
docker rm dev_database

docker run -v devpgdata:/var/lib/postgresql/data -p $POSTGRES_PORT:5432 -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_DB=$POSTGRES_DATABASE --name dev_database -d postgres:9.6-alpine

cd database/dbloader

node configureDatabase.js -v ../../src/runtime/configs/validatorConfig.json
node importRulesets.js -v ../../src/runtime/configs/validatorConfig.json -r ../../src/runtime/rulesets