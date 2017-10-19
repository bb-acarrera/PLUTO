#!/bin/sh


PACKAGE_VERSION=$(node -pe "require('./package.json').version")

echo Tagging version $PACKAGE_VERSION

docker tag pluto:develop pluto:$PACKAGE_VERSION
docker tag pluto:develop pluto:latest
docker tag pluto:develop uncharted/pluto:$PACKAGE_VERSION
docker tag pluto:develop uncharted/pluto:latest

docker tag pluto_dbloader:develop pluto_dbloader:$PACKAGE_VERSION
docker tag pluto_dbloader:develop pluto_dbloader:latest
docker tag pluto_dbloader:develop uncharted/pluto_dbloader:$PACKAGE_VERSION
docker tag pluto_dbloader:develop uncharted/pluto_dbloader:latest