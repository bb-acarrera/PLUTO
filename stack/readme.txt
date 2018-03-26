1. set the environement variable ELASICSEARCH_PASSWORD to the password you want to use for ElasticSearch:
 $ export ELASTIC_PASSWORD=password
 
2. Build PLUTO:
 $ npm run build
 
3. Build the stack containers
 $ cd stack
 $ docker-compose build
 
4. Start the stack
 $ docker-compose up

5. optionally, in another console, once the stack is started, add the MetricBeat dashboards to Kibana
 $ ./stack/setupDashboards.sh 
