From https://github.com/sverhoeven/docker-cartodb

To run, the carto container needs to be able to talk to itself, so the -h parameter in start_carto.sh must be set to an ip/domain name that points back to the machine running the container, and it must run on port 80. See the docs on https://github.com/sverhoeven/docker-cartodb for more details

Run start_carto.sh to start the service

And hit http://{your-local-ip/domain} to hit the service
(PA: Edit: I've also been able to hit it using 'localhost'.)

The default login is dev/pass1234

It also creates an 'example' organization with owner login admin4example/pass1234. Organization members can be created on http://{you-local-ip/domain}/user/admin4example/organization

The sql api endpoint looks like:
http://localhost:8080/user/dev/api/v2/sql?q=select * from worldcities&api_key={api-key}
(PA: Edit: http://{your-local-ip/domain}/user/dev/api/v2/sql?q=select%20*%20from%20worldcities&api_key=3aae23d5f1e0bd7a7464b6fd1cfbdf5519f4ae10)

Where the api key can be found at (Used to replace the api_key seen below.):
http://{your-local-ip/domain}/user/dev/your_apps
(PA: Edit: http://{your-local-ip/domain}/user/dev/your_apps or http://localhost/user/dev/your_apps)

Get the list of tables:
localhost:8080/user/dev/api/v1/sql?q=SELECT CDB_UserTables('all')&api_key=1869c1f0306e8aa2d3f648802dbb290a7978c448
(PA: Edit: http://{your-local-ip/domain}/user/dev/api/v2/sql?q=SELECT CDB_UserTables('all')&api_key=1869c1f0306e8aa2d3f648802dbb290a7978c448 this returns a JSON object. )

For a list of all available custom SQL functions for carto:
https://github.com/CartoDB/cartodb-postgresql/tree/master/scripts-available

Info on table api:
http://{your-local-ip/domain}/user/dev/api/v1/tables/YOUR_TABLE_NAME?api_key=blah
(PA: Edit: ex: http://{your-local-ip/domain}/user/dev/api/v1/tables/worldcities?api_key=3aae23d5f1e0bd7a7464b6fd1cfbdf5519f4ae10)

Full list of all API endpoints (documented and undocumented):
https://github.com/CartoDB/cartodb/blob/master/config/routes.rb

Also, a more complete production set up based on the sverhoeven/docker-cartodb that describes setting up nginx to look exactly like the carto.com site:
https://github.com/chriswhong/docker-cartodb


PA: Note: In some cases the URLs use v1 in others v2. In my edits above I use whichever worked for me.
PA: Note: Under some circumstances if you use "localhost" it will append the IP address to the hostname confusing things.