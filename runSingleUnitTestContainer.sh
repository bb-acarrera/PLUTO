#!/bin/sh

# docker run -v $PWD:/code -v /code/node_modules -p 9222:9222 --rm -ti --net=plutonet pluto_dev node --inspect-brk=localhost:9222 ../node_modules/qunitjs/bin/qunit $1

docker run -v $PWD:/code -v /code/node_modules -p 9222:9222 --rm -ti --net=plutonet pluto_dev node ../node_modules/qunitjs/bin/qunit $1