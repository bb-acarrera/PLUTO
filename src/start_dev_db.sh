#!/bin/sh

echo Must be run from PLUTO root dir

docker volume create devpgdata
docker run -v devpgdata:/var/lib/postgresql/data -v $PWD/database/initdb.d:/docker-entrypoint-initdb.d  -p 6543:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_USER=pluto -e POSTGRES_DB=pluto --name dev_database -d postgres:9.6-alpine
cd src/runtime/rulesets
node ../../../test_config/rulesets/import.js -v ../configs/validatorConfig.json