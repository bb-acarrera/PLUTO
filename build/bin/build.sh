#!/bin/sh

ROOT=`dirname $0`/../..
ROOT=`(cd $ROOT; echo $PWD)`
SRC=$ROOT/src
DST=$ROOT/Release
CLIENT=$ROOT/src/client
EMBER_DST=$DST/server/public
SERVER_DST=$DST/server
DEPLOY_DST=$DST/deploy
CONFIG_DST=$DEPLOY_DST/sample_config
CONFIG=$ROOT/test_config
DEPLOY_SRC=$ROOT/deploy
DB_SRC=$ROOT/database
DBLOADER_DST=$DST/dbloader
DBLOADER_SRC=$DB_SRC/dbloader

PACKAGE_VERSION=$(node -pe "require('./package.json').version")

echo Building version $PACKAGE_VERSION

rm -rf $DST

# Make sure the destination folder exists.
if [ ! -d $DST ]; then
    echo "Creating ${DST}."
    mkdir $DST
    mkdir $SERVER_DST

fi

echo "build the pluto base docker image"
docker build -t pluto_base -f $ROOT/dev_container/plutoBase.Dockerfile $ROOT/dev_container
if [ $? -ne 0 ]; then
    echo "Failed to build the base image." >&2
    exit 1
fi

# Make sure current packages are up to date
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install server/validator packages." >&2
    exit 1
fi

cd $CLIENT
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install client packages." >&2
    exit 1
fi

cd $ROOT

# Copy the files required to run the validator and server.
echo "Copying server directories."
for dir in server common api rules validator
do
    cp -r $SRC/$dir $SERVER_DST
done

cp $SRC/../package.json $SERVER_DST
cp $SRC/runtime/configs/serverConfig.json $SERVER_DST/serverConfig.json
cp $SRC/../Dockerfile $SERVER_DST
cp $SRC/../worker.Dockerfile $SERVER_DST

# Build the client. NOTE: This is doing a development build not a production build.
echo "Building client."
cd $CLIENT

CLIENT_PACKAGE_VERSION=$(node -pe "require('./package.json').version")

if [ "$PACKAGE_VERSION" != "$CLIENT_PACKAGE_VERSION" ]; then
    echo update the client version $CLIENT_PACKAGE_VERSION to match the main version
    npm version --not-git-tag-version $PACKAGE_VERSION
    if [ $? -ne 0 ]; then
        echo "Failed to update client version." >&2
        exit 1
    fi
fi

./node_modules/.bin/ember build --environment=production --output-path=$EMBER_DST
if [ $? -ne 0 ]; then
    echo "Failed to build client." >&2
    exit 1
fi

# build the releaseble depoyment files
echo "Building deployable files"
cd $ROOT
mkdir $DEPLOY_DST
mkdir $CONFIG_DST


cp $DEPLOY_SRC/* $DEPLOY_DST

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

#build the readme
./node_modules/.bin/markdown ./deployedReadme.md > $DEPLOY_DST/readme.html
if [ $? -ne 0 ]; then
    echo "Failed to build readme.html." >&2
    exit 1
fi

#copy the dbloader
mkdir $DBLOADER_DST
mkdir $DBLOADER_DST/migrations

cp $DBLOADER_SRC/* $DBLOADER_DST
cp $DBLOADER_SRC/migrations/* $DBLOADER_DST/migrations

cp $SRC/common/Util.js $DBLOADER_DST

echo "Build the server docker image"
docker build -t pluto:develop -f $SERVER_DST/Dockerfile $DST/server
if [ $? -ne 0 ]; then
    echo "Failed to build the server docker image." >&2
    exit 1
fi

echo "Build the worker docker image"
docker build -t pluto_worker:develop -f $SERVER_DST/worker.Dockerfile $DST/server
if [ $? -ne 0 ]; then
    echo "Failed to build the worker docker image." >&2
    exit 1
fi

echo "Build the data load docker image"
docker build -t pluto_dbloader:develop -f $DBLOADER_DST/Dockerfile $DBLOADER_DST
if [ $? -ne 0 ]; then
    echo "Failed to build the data load docker image." >&2
    exit 1
fi
