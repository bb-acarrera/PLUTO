#!/bin/sh

# cd /Users/ptokarchuk/git/mapvalidator
PATH=$PWD/node_modules/qunitjs/bin:$PATH
qunit 'src/server/tests/*/*.js' 'src/validator/tests/*/*.js'

echo $?
