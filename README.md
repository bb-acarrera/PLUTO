# PLUTO
Primary Layer Updating Tool

## Building

First, set up the environment:

```shell
npm install
```

To build the docker container:

```shell
npm run build
npm run docker_build
```

'npm run build' executes the build script, and puts the build into the "./Release" folder.
'npm run docker_build' builds the docker container



## Starting the services

```shell
./startPluto.sh
```

OR

```shell
npm run start
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

## Ruleset Configuration
[Ruleset][ruleset]

## Starting dev database and running locally
To run the validator and server locally for dev and debugging purposes, a separate debug database can be started via:

```shell
./src/start_dev_db.sh
```
This will start the dev database and import/update the rulesets from the src/runtime/rulesets folder.

There are debug configurations also set up in the src folder. To start the web service locally:

```shell
cd src
node server\server.js -s $PWD/server/debugServerConfig.json -v $PWD/runtime/configs/validatorConfig.json
```

To run the validator manually:

```shell
cd src
node validator\validator.js -r CheckDataRulesetConfig.json -c $PWD/runtime/configs/validatorConfig.json -v $PWD/runtime/rulesets/override.json"
```

or

```shell
cd src
node validator\validator.js -r CheckDataRulesetConfig.json -c $PWD/runtime/configs/validatorConfig.json -i examples/data/simplemaps-worldcities-basic.csv -o ../results/simplemaps-worldcities-basic.csv.out
```

## More..

Additional iformation can be found in the following documents.

[Server][server] <span style="color: red">Needs updating</span>

[Validator][validator]

[Ruleset][ruleset]

[Rules][rules]

[server]: docs/server.md
[validator]: docs/validator.md
[ruleset]: docs/ruleset.md
[rules]: docs/rules.md
