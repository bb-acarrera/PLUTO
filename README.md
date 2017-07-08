# PLUTO
Primary Layer Updating Tool

## Ruleset Configuration
[Ruleset][ruleset]

## Executing Docker Container
The container will listen on port 3000, and expects a configuration volume mounted to `/opt/PLUTO/config`.  For example:

```shell
docker run -v $PWD/config:/opt/PLUTO/config -p 3000:3000 -d pluto
```
or call the shell script:
```shell
startPluto.sh
```
The test_config folder at the source root contains a default valid configuration that can be used.

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

## More...
[Server][server] <span style="color: red">Needs updating</span>

[Validator][validator]

[Ruleset][ruleset]

[Rules][rules]

[server]: docs/server.md
[validator]: docs/validator.md
[ruleset]: docs/ruleset.md
[rules]: docs/rules.md
