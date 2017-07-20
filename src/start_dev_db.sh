#!/bin/sh

echo Must be run from PLUTO root dir

docker volume create devpgdata
docker run -v devpgdata:/var/lib/postgresql/data -v $PWD/database/initdb.d:/docker-entrypoint-initdb.d  -p 6543:6543 -e POSTGRES_PASSWORD=password -e POSTGRES_USER=pluto -e POSTGRES_DB=pluto -d postgres:9.6-alpine
