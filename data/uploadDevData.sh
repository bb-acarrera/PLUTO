#!/bin/sh

echo Run from the data folder

node s3.js -b test -n
node s3.js -b testoutput -n

node s3.js -b test -r worldcities.csv -l ../src/examples/data/worldcities.csv -u
node s3.js -b test -r simplemaps-worldcities-basic.csv -l ../src/examples/data/simplemaps-worldcities-basic.csv -u