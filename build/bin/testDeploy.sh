#!/bin/sh

ROOT=`dirname $0`/../..
ROOT=`(cd $ROOT; echo $PWD)`
CLIENT=$ROOT/src/client
DST=$ROOT/public

cd $CLIENT
ember build --environment=development --output-path=$DST

