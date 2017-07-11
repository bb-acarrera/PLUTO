# validator.js
## 1. Overview
The validator is a command line tool run by the server. Through plug-ins called '[rules][rules]' it can validate
and perform simple edits to input files.

It can also be run directly from the command line so that it can be launched from schedulers such as
`cron` or from pipeline tools such as [Luigi](http://luigi.readthedocs.io).

## 2. Command Line Arguments
### 2.1. -c, --config \<configFile> _(Required)_
The validator configuration file to use. By changing the configuration file the behavior of the
validator can easily be changed. By changing the configuration file the validator can be pointed at
different sets of rules, or output to different directories, etc.

The given `configFile` argument should either be an absolute path on the local file system or a path
relative to the working directory of the validator application.

See the [Configuration File](#Configuration File) section for a description of the contents of the configuration file.

### 2.2. -r, --ruleset \<rulesetFile> _(Required)_
The ruleset file to use to process the input file. If this is not set then the ruleset specified in the validator
configuration file is used. If both are specified then the ruleset specified on the command line takes precedence over
the one specified in the configuration file. This will be resolved against the RulesetDirectory specified in the
validator configuration file.

### 2.3. -i, --input \<filename> _(Optional)_
The name of the input file to validate. This overrides the input file specified in the [ruleset][ruleset].

### 2.4. -o, --output \<filename> _(Optional)_
The name of the output file (the file after all the rules have been run). This is passed to the DataAPI plug-in to save
upon completion. If no output file is specified on the command line nor in the [ruleset][ruleset] then
the rules are run, error reports are generated, but no output file is produced.

### 2.5. -e, --encoding \[encoding] _(Optional)_
The encoding used by the input file. The default is `utf-8`. This encoding is passed to the rules without
verifying that it is a valid encoding. It is the responsibility for rules to decide if an encoding is
valid and whether or not they can handle it.

### 2.6. -v, --rulesetoverride \<rulesetOverrideFile> _(Optional)_
The ruleset override replaces properties on a default [ruleset][ruleset] allowing one ruleset file to
be used to validate and edit many different files without changing the default ruleset file. Additionally
it allows overriding properties on the importer and exporter used by the validator, for example,
to use different authentication values for different files or databases.
  
## 3. Configuration File

In the default Docker release, in the `config` directory should be a `validatorConfig.json` file that
tells the validator where the folder required to operate properly can be found. (The name and location
of the file is not significant and in other releases could be placed elsewhere and named something else.)

The configuration file is a JSON file with the following properties.

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
- **RootDirectory** the root of the `config` folder. This is _optional_ and if
not specified defaults to the current working directory for the application. (When the validator is in
a Docker container this would be the root of the mounted volume.)
- **RulesetDirectory** the folder where all ruleset configurations are stored
- **RulesDirectory** the folder where all custom rule scripts are stored
- **TempDirectory** a folder to store temporary files
- **InputDirectory** only needed when running the validator from the command line, the default folder where files to be
processed files are stored. This is _optional_ and defaults to the current working directory of the application.
- **OutputDirectory** the folder where processed files will be stored
- **LogDirectory** the folder where the error logs of processing files will be stored
- **RunsDirectory** the folder where the processing details will be stored

## 4. Running Rulesets (COMPLETE THIS!!!)

Running stops immediately when a rule posts an error to the error log.

[ruleset]: docs/ruleset.md
[rules]: docs/rules.md
