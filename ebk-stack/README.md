# EBK Stack

This stack consists of Filebeat (https://www.elastic.co/products/beats/filebeat), Metricbeat (https://www.elastic.co/products/beats/metricbeat), Elasticsearch (https://www.elastic.co/products/elasticsearch) and Kibana (https://www.elastic.co/products/kibana). This is a lightweight stack that combines some of the features of both lelk and prometheus stacks - log shipping and metrics shipping.

Advantages of this stack:
- Requires no changes to application containers, they can continue to log however they like to stdout
- Logging services failing does not affect running containers, logs are still available via `docker logs`
- Filebeat has a nice small footprint and startup time (compared to logstash)
- Metricbeat captures system stats with the addition of one small container vs adding a whole separate database (prometheus)
- Nicely combines multi-line log messages (stacktraces) into a single log record
- ElasticSearch pipeline processors still allow extraction of key field value from log string

Disadvantages of this stack:
- Slightly messy approach of reading the `/var/docker/containers` logs directly from the filesystem
- Storing metrics as documents in ES is not the most efficient way to store timeseries numbers - can grow quickly
- To address the above, the metrics are only polled/stored infrequently (e.g. 30 seconds)

### Filebeat
Deployed to each node in a swarm, Filebeat tails the `/var/docker/containers` log files and ships them to Elasticsearch. It could be replaced with Logstash.

Unfortunately due to file permissions we can't just mount the configuration file into the container and must build a custom image for filebeat with the config in it. See the configuration file for comments on what it does and how.

### Metricbeat
Deployed to each node in a swarm, Metricbeat monitors the host and uses the Docker API to collect container statistics. Collecting metrics can use up a lot of space in ES since metrics are collected 24/7 regardless of whether the app is being used. Remove from the stack if you do not want to collect system health metrics.

### ElasticSearch
ElasticSearch is the document store and search index for all logs and metrics data. This example uses a short-lived configuration container (`/configure`) to setup some things on ES once it's started, specifically pipelines. This is simply done by running a few `curl` commands in an Alpine container once ES starts.

#### Pipelines
This example sets up a pipeline for processing standard Apache "combined" style log strings and extracting the key content out into separate document fields. This includes a grok filter, a geoip lookup, and a user agent parser. These processors replace the need for logstash in this stack. They take log strings and give us results like this:

```
  "_source": {
    "request": "/favicon.ico",
    "agent": "\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36\"",
    "geoip": {
      "continent_name": "Europe",
      "city_name": null,
      "country_iso_code": "DE",
      "region_name": null,
      "location": {
        "lon": 9,
        "lat": 51
      }
    },
    "auth": "-",
    "ident": "-",
    "verb": "GET",
    "message": "212.87.37.154 - - [12/Sep/2016:16:21:15 +0000] \"GET /favicon.ico HTTP/1.1\" 200 3638 \"-\" \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36\"",
    "referrer": "\"-\"",
    "@timestamp": "2016-09-12T16:21:15.000Z",
    "response": 200,
    "bytes": 3638,
    "clientip": "212.87.37.154",
    "httpversion": "1.1",
    "user_agent": {
      "patch": "2743",
      "major": "52",
      "minor": "0",
      "os": "Mac OS X 10.11.6",
      "os_minor": "11",
      "os_major": "10",
      "name": "Chrome",
      "os_name": "Mac OS X",
      "device": "Other"
    },
    "timestamp": "12/Sep/2016:16:21:15 +0000"
  }
```

### Kibana
A tool to visualize your logs (and metrics). Note that the beats depend on kibana so that they can add schemas, visualizations, and dashboards automatically on startup. Access kibana on port `5601`


## Building EBK Stack
This stack has a custom-built container in it that needs to be built, tagged, and pushed. Using the local registry defined [at the root](../), use:
```
# Within the env of one of your swarm nodes (eval $(docker-machine ...)), build:
docker-compose -f ebk-stack/docker-compose.yml build
# Then push:
docker push localhost:5000/swarm-production-example/filebeat:1.0.0
```

## Running EBK Stack
```
# Deploy the stack
docker stack deploy -c ebk-stack/docker-compose-stack.yml ebk

# Verify the stack is running
docker stack ps ebk

# Generate an error log
curl $(docker-machine ip swarm-1):3000/error

# View logs and/or metrics in Kibana
open $(docker-machine ip swarm-1):5601
```
