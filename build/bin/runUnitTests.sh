#!/bin/sh

# cd /Users/ptokarchuk/git/mapvalidator
PATH=$PWD/node_modules/qunitjs/bin:$PATH

node --version

qunit 'src/server/tests/*/*.js' 'src/validator/tests/*/*.js'

exit $?

