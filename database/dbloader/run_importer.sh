#!/bin/sh
node configureDatabase.js -v ./config/validatorConfig.json
node importRulesets.js -v ./config/validatorConfig.json