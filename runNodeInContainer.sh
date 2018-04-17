#!/bin/sh

docker run -v $PWD:/code -v /code/node_modules --rm -ti pluto_dev node "$@"