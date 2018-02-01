#!/bin/sh

ROOT=`dirname $0`/../..
ROOT=`(cd $ROOT; echo $PWD)`

docker build -t pluto_base -f $ROOT/dev_container/plutoBase.Dockerfile $ROOT/dev_container

docker build -t pluto_test -f $ROOT/build/test.Dockerfile $ROOT

docker run -v $ROOT:/code --net=plutonet --rm -a stdout -a stderr pluto_test
