#!/bin/sh

cd database/dbloader

node configureDatabase.js -v ../../src/runtime/configs/validatorConfigContainer.json -n /node_modules/.bin
node importRulesets.js -v ../../src/runtime/configs/validatorConfigContainer.json -r ../../src/runtime/rulesets