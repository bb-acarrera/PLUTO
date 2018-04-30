#!/bin/sh

# TODO: Change 192.168.56.1 to be an environment variable that points to the actual current machine (your development machine). (192.168.56.1 is Luke's machine.)
docker run -d -p 80:80 -p 8080:8080 -p 8081:8081 -h 192.168.56.1 --name carto sverhoeven/cartodb

# https://github.com/sverhoeven/docker-cartodb

# The default login is dev/pass1234
# It also creates an 'example' organization with owner login admin4example/pass1234. Organization members can be created on http://cartodb.localhost/user/admin4example/organization