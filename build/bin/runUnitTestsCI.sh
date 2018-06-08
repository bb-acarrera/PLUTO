#!/bin/sh

ROOT=`dirname $0`/../..
echo $ROOT
ROOT=`(cd $ROOT; echo $PWD)`
echo $ROOT


docker build --rm=false -t pluto_base -f $ROOT/dev_container/plutoBase.Dockerfile $ROOT/dev_container

docker build --rm=false -t pluto_dev -f $ROOT/dev_container/dev.Dockerfile $ROOT

docker build --rm=false -t pluto_test -f $ROOT/build/test.Dockerfile $ROOT

ls -l $ROOT
ls -l $ROOT/src/server/tests/*/test-*.js
ls -l $ROOT/src/validator/tests/*/test-*.js

docker run -v $ROOT:/code -v /code/node_modules --rm -a stdout -a stderr pluto_test
