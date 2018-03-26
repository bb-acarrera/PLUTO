#!/bin/sh


#Start QA
cd test_config

POSTGRES_PORT=$(node -pe "require('./validatorConfigQA.json').dbPort")
POSTGRES_USER=$(node -pe "require('./validatorConfigQA.json').dbUser")
POSTGRES_PASSWORD=$(node -pe "require('./validatorConfigQA.json').dbPassword")
POSTGRES_DATABASE=$(node -pe "require('./validatorConfigQA.json').dbDatabase")

cd ..

docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 plutonet
docker volume create pgdataQA

docker stop pluto_db_qa
docker rm pluto_db_qa

docker run -v pgdataQA:/var/lib/postgresql/data -p $POSTGRES_PORT:5432 -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_DB=$POSTGRES_DATABASE --net=plutonet --name pluto_db_qa -d postgres:9.6-alpine
docker run -v $PWD/test_config:/opt/PLUTO/config -v $PWD/test_config/validatorConfigQA.json:/opt/PLUTO/config/validatorConfig.json  --net=plutonet --rm -a stdout -a stderr pluto_dbloader:develop

docker stop pluto_ws_qa
docker rm pluto_ws_qa

docker run -v $PWD/test_config:/opt/PLUTO/config -v $PWD/test_config/validatorConfigQA.json:/opt/PLUTO/config/validatorConfig.json -p 3000:3000 --net=plutonet --name pluto_ws_qa -d pluto:develop

docker stop pluto_nginx_qa
docker rm pluto_nginx_qa

docker run -v $PWD/test_nginx.conf:/etc/nginx/nginx.conf:ro -p 8001:8001 -p 8002:8002 -p 8003:8003 -p 8004:8004 --net=plutonet --name pluto_nginx_qa -d nginx:stable-alpine

docker run -p 8000:8000 --net=plutonet --name pluto_s3server_qa -d scality/s3server


#start PROD
cd test_config

POSTGRES_PORT=$(node -pe "require('./validatorConfigPROD.json').dbPort")
POSTGRES_USER=$(node -pe "require('./validatorConfigPROD.json').dbUser")
POSTGRES_PASSWORD=$(node -pe "require('./validatorConfigPROD.json').dbPassword")
POSTGRES_DATABASE=$(node -pe "require('./validatorConfigPROD.json').dbDatabase")

cd ..

docker network create -d bridge --subnet 192.168.1.0/24 --gateway 192.168.1.1 plutonet2
docker volume create pgdataPROD

docker stop pluto_db_prod
docker rm pluto_db_prod

docker run -v pgdataPROD:/var/lib/postgresql/data -p $POSTGRES_PORT:5432 -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_DB=$POSTGRES_DATABASE --net=plutonet2 --name pluto_db_prod -d postgres:9.6-alpine
docker run -v $PWD/test_config:/opt/PLUTO/config -v $PWD/test_config/validatorConfigPROD.json:/opt/PLUTO/config/validatorConfig.json  --net=plutonet2 --rm -a stdout -a stderr pluto_dbloader:develop

docker stop pluto_ws_prod
docker rm pluto_ws_prod

docker run -v $PWD/test_config:/opt/PLUTO/config -v $PWD/test_config/validatorConfigPROD.json:/opt/PLUTO/config/validatorConfig.json -p 4000:3000 --net=plutonet2 --name pluto_ws_prod -d pluto:develop

docker stop pluto_nginx_prod
docker rm pluto_nginx_prod

docker run -v $PWD/test_nginx.conf:/etc/nginx/nginx.conf:ro -p 9001:8001 -p 9002:8002 -p 9003:8003 -p 9004:8004 --net=plutonet2 --name pluto_nginx_prod -d nginx:stable-alpine

docker run -p 9000:8000 --net=plutonet2 --name pluto_s3server_prod -d scality/s3server