#!/bin/sh
#source ../../virtualEnvironment/bin/activate
export PYTHONPATH=../tasks
python -m luigi --module PlutoTask PlutoTask --configFile ../plutoTaskConfig.json --previousTaskModule FakeDownloadTask --previousTaskClass FakeDownloadTask --local-scheduler
