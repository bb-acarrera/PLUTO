#!/bin/sh

docker run -v /var/lib/postgresql/data -v $PWD/database/initdb.d:/docker-entrypoint-initdb.d  -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_USER=pluto -e POSTGRES_DB=pluto -d postgres:9.6-alpine
docker run -v $PWD/test_config:/opt/PLUTO/config -p 3000:3000 -d pluto

