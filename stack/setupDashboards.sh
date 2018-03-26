#!/bin/sh

docker run -e ELASTIC_PASSWORD=${ELASTIC_PASSWORD} -e ELASTIC_HOST=http://192.168.0.1:9200 -e KIBANA_HOST=http://192.168.0.1:5601 metricbeat:1.0.0 setup --dashboards
