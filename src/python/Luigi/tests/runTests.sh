#!/bin/sh
export PYTHONPATH=../tasks
python -m luigi --module PlutoTask PlutoTask --configFile ../plutoTaskConfig.json --previousTaskModule FakeDownloadTask --previousTaskClass FakeDownloadTask --local-scheduler
