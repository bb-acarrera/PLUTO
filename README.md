# PLUTO
Primary Layer Updating Tool

## Setup and Building

First, set up the environment:

```shell

./setupDevEnvironment.sh
```

To build the docker container:

```shell
npm run build
```

'npm run build' executes the build script, and puts the build into the "./Release" folder.
'npm run docker_build' builds the docker container



## Starting the services

```shell
npm run start_docker
```

It will create a docker volume for the Postgresql database (pgdata), start the database, and then start the web server.

The Postgres database container is listening on port 5432, with user pluto.
The web service container will listen on port 3000, and expects a configuration volume mounted to `/opt/PLUTO/config`.  

The test_config folder at the source root contains a default valid configuration that is mounted to `/opt/PLUTO/config`.
The script will also import the rulesets in `test_config/rulesets` into the database.

## Calling the Service

To process a file, POST to `http://localhost:3000/processfile` with a json package. At a minimum, it must specify a ruleset to execute:

```json
{
	"ruleset": "sampleRuleset"
}
```
And can be call via:

```
curl -d '{"ruleset": "sampleRuleset"}' -H "Content-Type: application/json" -X POST http://localhost:3000/processfile
```

If a custom importer is used as part of the [ruleset][ruleset], import configuration (as defined by the importer) can be supplied as part of the `POST`:

```json
{
	"ruleset": "sampleRuleset",
	"import": {
		"file":"http://someurl.com/somefile.csv",
		"auth":"some authentication"
	}
}
```

## Configuring
All configuration properties are in validatorConfig.json. When the built container is started via `npm run start_docker`, 
it loads the validatorConfig.json from the root of `test_config`. The properties are:

#### configHost
The hostname of the sever host the PLUTO web server.  This is used by the emailer when generating links to processed files.

#### configHostProtocol
The protocol to use in generated links to the PLUTO web server. Defaults to "http" if not set.

#### smtpConfig
This configures the connection to the smtp server so that emails can be sent from the validator once processing is complete.
PLUTO uses Nodemailer's (https://nodemailer.com) smtp transport, and smtpConfig is passed directly to createTransport. 
Details on configuration can be found at https://nodemailer.com/smtp/

#### emailFrom
This is what will appear in the From on sent emails

## Starting dev database and running locally
To run the validator and server locally for dev and debugging purposes, a separate debug database can be started via:

```shell
npm run start_devdb
```
This will start the dev database on port 6543 and import/update the rulesets from the src/runtime/rulesets folder.

There are debug configurations also set up in the src folder. To start the web service locally:

```shell
cd src
node server/server.js -s $PWD/server/debugServerConfig.json -v $PWD/runtime/configs/validatorConfig.json
```

To run the validator manually:

```shell
cd src
node validator/validator.js -r CheckDataRulesetConfig -c $PWD/runtime/configs/validatorConfig.json -v $PWD/runtime/rulesets/override.json"
```

or

```shell
cd src
node validator/validator.js -r CheckDataRulesetConfig -c $PWD/runtime/configs/validatorConfig.json -i examples/data/simplemaps-worldcities-basic.csv -o ../results/simplemaps-worldcities-basic.csv.out
```

## Changing the database schema
We're using node-pg-migrate (https://github.com/salsita/node-pg-migrate) to manage migration.  Migration scripts are 
executed as part of the dev database startup and built as part of the pluto_dbloader container.

Docs on the tools are here: https://github.com/salsita/node-pg-migrate

First, a config file needs to be generated for the tool. To generate one against the dev db:

```shell
cd database/dbloader
node configureDatabase.js -v ../../src/runtime/configs/validatorConfig.json
```

which should create dbconfig.json in that folder. To test out the migration:

```shell
../../node_modules/.bin/pg-migrate up -f dbconfig.json
```

To create a new migration script:

```
../../node_modules/.bin/pg-migrate create your-new-migration
```

which will place the script in the database/dbloader/migrations folder.  Follow the docs on how to create new migrations.

## Building the client for development

first time:
```shell
npm install -g ember-cli
```

to build:
```shell
cd src/client
ember build
```

to monitor and build automatically:
```shell
cd src/client
ember server
```

## Deploying

After the project is built, in the `Release` folder a `deploy` folder is created that contains some basic info in `readme`, a sample config folder, a script to start pluto (create and start the db and start the server), and a sample `Dockerfile` as an example on how to extend the pluto container to support plugin dependencies.


## More..

Additional information can be found in the following documents.

[Server][server] <span style="color: red">Needs updating</span>

[Validator][validator]

[Ruleset][ruleset]

[Rules][rules]

[server]: docs/server.md
[validator]: docs/validator.md
[ruleset]: docs/ruleset.md
[rules]: docs/rules.md
