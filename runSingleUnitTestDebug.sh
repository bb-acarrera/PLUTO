#!/bin/sh

docker run -v $PWD:/code -v /code/node_modules --rm -ti -p 9229:9229 pluto_dev node --inspect-brk ../node_modules/qunitjs/bin/qunit $1