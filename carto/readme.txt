From https://github.com/sverhoeven/docker-cartodb

To run, the carto container needs to be able to talk to itself, so the -h paramerter in start_carto.sh must be set to a ip/domain name that points back to the machine running the container, and it must run on port 80. See the docs on https://github.com/sverhoeven/docker-cartodb for more details

Run start_carto.sh to start the service

And hit http://{you-local-ip/domain} to hit the service

The default login is dev/pass1234

It also creates an 'example' organization with owner login admin4example/pass1234. Organization members can be created on 
http://{you-local-ip/domain}/user/admin4example/organization

The sql api endpoint looks like:

localhost:8080/user/dev/api/v2/sql?q=select * from worldcities&api_key={api-key}

Where the api key can be found at:
http://{you-local-ip/domain}/user/dev/your_apps


Get the list of tables:
localhost:8080/user/dev/api/v1/sql?q=SELECT CDB_UserTables('all')&api_key=1869c1f0306e8aa2d3f648802dbb290a7978c448

For a list of all available custom SQL funcitons for carto:
https://github.com/CartoDB/cartodb-postgresql/tree/master/scripts-available

Info on table api:

http://{you-local-ip/domain}/user/dev/api/v1/tables/YOUR_TABLE_NAME?api_key=blah

Also, a more complete production set up based on the sverhoeven/docker-cartodb that describes setting up nginx to look exactly like the carto.com site:
https://github.com/chriswhong/docker-cartodb

