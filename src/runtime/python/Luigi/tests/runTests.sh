#!/bin/sh
#source ../../virtualEnvironment/bin/activate
export PYTHONPATH=../tasks
python3 -m luigi --module PlutoTask PlutoTask --configFile ../plutoTaskConfig.json --ruleset CheckDataRulesetConfig --previousTaskModule FakeDownloadTask --previousTaskClass FakeDownloadTask --sourceFile "../../../../examples/data/simplemaps-worldcities-basic.csv" --local-scheduler
