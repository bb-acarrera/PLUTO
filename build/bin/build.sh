#!/bin/sh

ROOT=`dirname $0`/../..
ROOT=`(cd $ROOT; echo $PWD)`
SRC=$ROOT/src
DST=$ROOT/Release
CLIENT=$ROOT/src/client
EMBER_DST=$DST/server/public
SERVER_DST=$DST/server
DEPLOY_DST=$DST/deploy
DB_SRC=$ROOT/database
DB_DST=$DEPLOY_DST/database
CONFIG_DST=$DEPLOY_DST/sample_config
CONFIG=$ROOT/test_config
DEPLOY_SRC=$ROOT/deploy
DBLOADER_DST=$DST/dbloader
DBLOADER_SRC=$DB_SRC/dbloader

rm -rf $DST

# Make sure the destination folder exists.
if [ ! -d $DST ]; then
    echo "Creating ${DST}."
    mkdir $DST
    mkdir $SERVER_DST

fi

# Copy the files required to run the validator and server.
echo "Copying server directories."
for dir in server common api rules validator
do
    cp -r $SRC/$dir $SERVER_DST
done

cp $SRC/../package.json $SERVER_DST
cp $SRC/runtime/configs/serverConfig.json $SERVER_DST/serverConfig.json
cp $SRC/../Dockerfile $SERVER_DST

echo "install npm dependencies"
cd $SERVER_DST
npm install --production

# Build the client. NOTE: This is doing a development build not a production build.
echo "Building client."
cd $CLIENT
ember build --environment=development --output-path=$EMBER_DST

# build the releaseble depoyment files
echo "Building deployable files"
cd $ROOT
mkdir $DEPLOY_DST
mkdir $DB_DST
mkdir $DB_DST/initdb.d
mkdir $CONFIG_DST
mkdir $DBLOADER_DST

cp $DEPLOY_SRC/* $DEPLOY_DST

#copy database files
cp $DB_SRC/initdb.d/* $DB_DST/initdb.d

#build/copy sample config
mkdir $CONFIG_DST/results
mkdir $CONFIG_DST/results/logs
mkdir $CONFIG_DST/results/runs
mkdir $CONFIG_DST/tmp

for dir in customRules rulesets test_data
do
    cp -r $CONFIG/$dir $CONFIG_DST
done

for file in copy.py export.js import.js validatorConfig.json
do
    cp $CONFIG/$file $CONFIG_DST
done

#copy the dbloader
cp $DBLOADER_SRC/* $DBLOADER_DST

echo "Build the server docker image"
docker build -t pluto:develop -f $SERVER_DST/Dockerfile $DST/server

echo "Build the data load docker image"
docker build -t pluto_dbloader:develop -f $DBLOADER_DST/Dockerfile $DBLOADER_DST
