#!/bin/sh

docker stop dev_database
docker rm dev_database
docker volume rm devpgdata
