#!/bin/sh

echo This must be run from the root pluto folder where this shell script resides

if hash node 2>/dev/null; then
    cd sample_config

    POSTGRES_PORT=$(node -pe "require('./validatorConfig.json').dbPort")
    POSTGRES_USER=$(node -pe "require('./validatorConfig.json').dbUser")
    POSTGRES_PASSWORD=$(node -pe "require('./validatorConfig.json').dbPassword")
    POSTGRES_DATABASE=$(node -pe "require('./validatorConfig.json').dbDatabase")

    cd ..
else
    POSTGRES_PORT=5432
    POSTGRES_USER=pluto
    POSTGRES_PASSWORD=password
    POSTGRES_DATABASE=pluto
fi



docker stop pluto_server
docker rm pluto_server

#create a bridge network so the server can talk to the db
docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 plutonet

#create a volume for the database
docker volume create pgdata

#start the database container, if the pluto database doesn't exist, create it and run all the .sql files in database/init.d (which will create the tables)
docker run -v pgdata:/var/lib/postgresql/data -p $POSTGRES_PORT:5432 -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_DB=$POSTGRES_DATABASE --net=plutonet --name pluto_db -d postgres:9.6-alpine

#configure the database
docker run -v $PWD/sample_config:/opt/PLUTO/config --net=plutonet --rm -a stdout -a stderr pluto_dbloader

#start the pluto server, using the sample_config as the config folder
docker run -v $PWD/sample_config:/opt/PLUTO/config -p 3000:3000 --net=plutonet --name pluto_server -d pluto
