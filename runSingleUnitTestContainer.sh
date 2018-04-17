#!/bin/sh

docker run -v $PWD:/code -v /code/node_modules --rm -ti --net=plutonet pluto_dev node ../node_modules/qunitjs/bin/qunit $1