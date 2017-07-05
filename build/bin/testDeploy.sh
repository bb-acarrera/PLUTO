#!/bin/sh

ROOT=`dirname $0`/../..
ROOT=`(cd $ROOT; echo $PWD)`
SRC=$ROOT/src
DST=$ROOT/Release
CLIENT=$ROOT/src/client
EMBER_DST=$DST/public

rm -rf $DST

# Make sure the destination folder exists.
if [ ! -d $DST ]; then
    echo "Creating ${DST}."
    mkdir $DST
fi

# Copy the files required to run the validator and server.
echo "Copying runtime directories."
for dir in runtime server utilities validator examples/data
do
    cp -r $SRC/$dir $DST
done

cp $SRC/../package.json $DST
cp $DST/runtime/configs/serverConfig.json $DST/serverConfig.json

echo "install npm dependencies"
cd $DST
npm install --production

# Build the client. NOTE: This is doing a development build not a production build.
echo "Building client."
cd $CLIENT
ember build --environment=development --output-path=$EMBER_DST

