#!/bin/sh

docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 plutonet
docker volume create pgdata
docker run -v pgdata:/var/lib/postgresql/data -v $PWD/database/initdb.d:/docker-entrypoint-initdb.d  -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_USER=pluto -e POSTGRES_DB=pluto --net=plutonet -d postgres:9.6-alpine
docker run -v $PWD/test_config:/opt/PLUTO/config -p 3000:3000 --net=plutonet  -ti pluto:develop /bin/sh

