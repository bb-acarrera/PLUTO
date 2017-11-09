#!/bin/sh


cd test_config

POSTGRES_PORT=$(node -pe "require('./validatorConfig.json').dbPort")
POSTGRES_USER=$(node -pe "require('./validatorConfig.json').dbUser")
POSTGRES_PASSWORD=$(node -pe "require('./validatorConfig.json').dbPassword")
POSTGRES_DATABASE=$(node -pe "require('./validatorConfig.json').dbDatabase")

cd ..

docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 plutonet
docker volume create pgdata
docker run -v pgdata:/var/lib/postgresql/data -p $POSTGRES_PORT:5432 -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_DB=$POSTGRES_DATABASE --net=plutonet --name pluto_db -d postgres:9.6-alpine
docker run -v $PWD/test_config:/opt/PLUTO/config --net=plutonet --rm -a stdout -a stderr pluto_dbloader:develop

docker stop pluto_ws
docker rm pluto_ws

docker run -v $PWD/test_config:/opt/PLUTO/config -p 3000:3000 --net=plutonet --name pluto_ws -d pluto:develop

docker stop pluto_nginx
docker rm pluto_nginx

docker run -v $PWD/test_nginx.conf:/etc/nginx/nginx.conf:ro -p 8001:8001 -p 8002:8002 -p 8003:8003 -p 8004:8004 --net=plutonet --name pluto_nginx -d nginx:stable-alpine
