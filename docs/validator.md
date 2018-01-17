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
The id of the ruleset to process.  

### 2.3. -i, --input \<filename> _(Optional)_
The name of the input file to validate. This overrides any source file specified in the [ruleset][ruleset].

### 2.4. -o, --output \<filename> _(Optional)_
The name of the output file (the file after all the rules have been run). This overrides any target file specified in 
the [ruleset][ruleset]. If no output file is specified on the command line nor in the [ruleset][ruleset] then
the rules are run, error reports are generated, but no output file is produced.

### 2.5. -v, --rulesetoverride \<rulesetOverrideFile> _(Optional)_
The path to a ruleset override, which replaces properties on a default [ruleset][ruleset] allowing one ruleset file to
be used to validate and edit many different files without changing the default ruleset file. Additionally
it allows overriding properties on the importer and exporter used by the validator, for example,
to use different authentication values for different files or databases or different file encodings.
  
## 3. Configuration File

In the default Docker release, in the `config` directory should be a `validatorConfig.json` file that
tells the validator where the folder required to operate properly can be found. (The name and location
of the file is not significant and in other releases could be placed elsewhere and named something else.)

Validator config structure and properties can be found [here][validatorConfig]

## 4. Validating Files

To validate a file three things are required, a ruleset, a rule files, and an file to validate. The
[ruleset] describes how the input file is retrieved from a remote location, a sequence of [rules] to
run the input file through, and how to export the resulting file and log results to a potentially different
remote location.

*In the near future setting all this up will be possible with a dedicated UI but
for now this is a manual process.*

### 4.1 Validator Configuration

Set up the validator configuration file as described above. The validator will use the values in this
file to locate the ruleset and rules.

### 4.2 Rules Directory

Place your rule files in the rules directory as defined in the validator configuration.

### 4.3 Importer and Exporter

If you are using an importer and/or exporter script place it/them in the root directory.

### 4.4 Ruleset File

Define your [ruleset] file. For simplicity add rules one at a time testing the ruleset
workflow after each addition. This will make debugging your ruleset easier.

### 4.5 Run the Validator

Run the validator from the command line passing in at least the validator configuration file and ruleset.

[ruleset]: docs/ruleset.md
[rules]: docs/rules.md
[validatorConfig]: docs/validatorConfig.md