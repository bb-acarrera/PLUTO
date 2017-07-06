# PLUTO
Primary Layer Updating Tool

## Ruleset configuration
**TBD**

## Executing Docker Container
The container will listen on port 3000, and expects a configuration volume mounted to /opt/PLUTO/config.  For example:

```shell
docker run -v $PWD/config:/opt/PLUTO/config -p 3000:3000 -d pluto
```
or call the shell script:
```shell
startPluto.sh
```
The test_config folder at the source root contains a default valid configuration that can be used.

In the root of the config directory should be a validatorConfig.json file that tells PLUTO where the required working folders can be found.

The validatorConfig.json should contain these items:

```json
{
	"RootDirectory" : "/opt/PLUTO/config",
	"RulesetDirectory" : "/opt/PLUTO/config/rulesets",
	"RulesDirectory" : "/opt/PLUTO/config/customRules",
	"TempDirectory" : "/opt/PLUTO/config/tmp",
	"InputDirectory" : "/opt/PLUTO/config",
	"OutputDirectory" : "/opt/PLUTO/config/results",
	"LogDirectory" : "/opt/PLUTO/config/results/logs",
	"RunsDirectory" : "/opt/PLUTO/config/results/runs"
}
```
- **RootDirectory** the root of the mounted config folder inside the container
- **RulesetDirectory** the folder where all ruleset configurations are stored
- **RulesDirectory** the folder where all custom rule scripts are stored
- **TempDirectory** a folder to store tempoarary files
- **InputDirectory** only used when running the validator from the command line, the default folder where files to be processed are stored. Currently required but will be made optional in the future
- **OutputDirectory** folder where processed files will be copied to
- **LogDirectory** folder where the error logs of processing files will be stored
- **RunsDirectory** folder where the file processing overview details will be stored

## Calling the service

To process a file, POST to http://localhost:3000/processfile with a json package.  At a minimum, it must specify a ruleset to execute:

```json
{
	"ruleset": "sampleConfig"
}
```
And can be call via:

```
curl -d '{"ruleset": "sampleConfig"}' -H "Content-Type: application/json" -X POST http://localhost:3000/processfile
```

If a custom importer is used as part of the ruleset, import configuration (as defined by the importer) can be supplied as part of the POST:

```json
{
	"ruleset": "sampleConfig",
	"import": {
		"file":"http://someurl.com/somefile.csv",
		"auth":"some authentication"
	}
}
```
