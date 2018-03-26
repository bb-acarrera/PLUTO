#!/bin/sh

set -euo pipefail

# Wait for Elasticsearch to start up before doing anything.
echo "Waiting for elasticsearch at $ELASTIC_HOST"
until curl -s $ELASTIC_HOST -o /dev/null; do
    sleep 1
done

# Add any .json file in the pipelines directory as an ES pipeline
FILES=./pipelines/*
for f in $FILES; do
  [ -e "$f" ] || continue
  filename=$(basename $f)
  name=${filename%.json}
  
  echo "Processing pipeline $f as $name..."
  # Add pipeline
  until curl -s -H 'Content-Type:application/json' \
       -XPUT $ELASTIC_HOST/_ingest/pipeline/$name \
       -d @$f
  do
      sleep 2
      echo Retrying...
  done
done