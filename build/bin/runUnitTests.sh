#!/bin/sh
PATH=$PWD/node_modules/qunitjs/bin:$PATH
qunit 'src/server/tests/*/*.js' 'src/validator/tests/*/*.js'
exit $?