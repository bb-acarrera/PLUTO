#!/bin/sh

docker run -v $PWD/test_config:/opt/PLUTO/config -p 3000:3000 -d pluto