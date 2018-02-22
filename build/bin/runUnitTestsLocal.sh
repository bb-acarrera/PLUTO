#!/bin/sh
PATH=$PWD/node_modules/qunitjs/bin:$PATH

qunit 'src/server/tests/*/test-*.js' 'src/validator/tests/*/test-*.js'
exit $?