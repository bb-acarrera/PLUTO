#!/bin/sh

ROOT=`dirname $0`/../..
ROOT=`(cd $ROOT; echo $PWD)`

docker build -t pluto_base -f $ROOT/dev_container/plutoBase.Dockerfile $ROOT/dev_container

cp $ROOT/package.json $ROOT/build

docker build -t pluto_test -f $ROOT/build/test.Dockerfile $ROOT/build

docker run -v $ROOT:/code --net=plutonet --rm -a stdout -a stderr pluto_test

#PATH=$PWD/node_modules/qunitjs/bin:$PATH
#qunit 'src/server/tests/*/test-*.js' 'src/validator/tests/*/test-*.js'
#exit $?