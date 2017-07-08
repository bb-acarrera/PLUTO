# Rulesets

Rulesets reference a collection of [rules][rules] that are used by the [validator][validator] to validate and
simply edit input files. Rulesets may contain a reference to an importer and/or an exporter to allow more
extensive import than simply reading from or writing to the local file system.

A ruleset can itself reference a single data file or through either the `-i/--input` or the
`-v/--rulesetoverride` command line arguments the file can be overridden allowing the ruleset to operate
on many different files.

Ruleset files must exist in the `RulesetDirectory` as set in the [validator][validator] configuration
file.

## 1. Overview

A ruleset is a [JSON](http://www.json.org) file with properties that describe a sequence of [rules][rules] the perform validation
and simple editing operations on an input data file. More complex rulesets can also properties that describe
a custom importer and/or a custom exporter that can be used to retrieve the input data file from somewhere
other than the local file system and export the resulting file somewhere other than the local file system
as well.

```json
{
	"RuleSet" : {
		"name" : "...",
		"rules" : [
		    ...
		],
		"import" : {
			...
		},
		"export" : {
			...
		}
	}
}
```

A ruleset has a single base property called `RuleSet` (capitalization is significant) which contains the
properties of the ruleset. The included properties are `name`, `rules`, `import`, and `export`. 

## 2. Ruleset Properties

The ruleset has four properties, `name` and `rules` which are required, and `import` and `export` which are
optional. The case of the properties is significant.

### 2.1. name _(Required)_

This is a human readable, unique name for the ruleset. It is used in the client UI to allow someone to
select and edit this ruleset. As a result it should be reasonably descriptive of what the sequence of rules
will do to the input files. For example "Validate Factory Data RuleSet" is good while "Validate Data" isn't.

### 2.2. rules _(Required)_

This part of the ruleset describes the rules used by the ruleset. They are enclosed in a `JSON` array with
the rules listed in the order that they will be executed.

Following is an example of a rule description included in the ruleset `rules`.

```json
{
    "FileName" : "CheckColumnCount",
    "Name" : "Validate column count",
    "Config" : {
        "Columns" : 9
    }
}
```
The rules have three required properties, `FileName`, `Name`, and `Config`.

#### 2.2.1. FileName

This is the file name of the JavaScript plug-in rule. If no suffix is specified `.js` is assumed.
The rule file must exist in the `RulesDirectory` as set in the [validator][validator] configuration file.

#### 2.2.2. Name

This is a human readable and unique name that should describe what the rule does. It will be displayed
in the client allowing users to associate validation failures back to a rule and to select rules to
add to a ruleset when they are editing the ruleset.

#### 2.2.3. Config

This section of the rule description is used to specify any configuration properties that are specific
to the rule. This property can either include the name of a configuration file or a `JSON` object. 

If a filename is specified then this is a reference to a `JSON` file in the `RulesDirectory`. No suffix
should be included as `.json` is assumed. The contents of the file are rule specific and are used by the
rule to specify values required for the proper operation of the rule. For example a rule that ensures
a `CSV` file has the correct number of columns would have a config that specifies the expected
number of columns.

Alternatively, rather than a filename, the rule configuration can be included directly in the ruleset.

Generally including the rule configuration in the ruleset is preferable over having it in a separate file.
 The only time you would want it in a file is if several rulesets require the same rule with the same
 properties.
 
### 2.3. import _(Optional)_

The `import` section is used to describe a custom importer. Custom importers
 allow retrieving input files from some location other than the local
 filesystem, for example from a database or a service such as S3.
 
Following is an example of an `import` property.
 
```json
"import" : {
    "ScriptPath": "/opt/PLUTO/config/import.js",
    "Config": {
        "file": "/opt/PLUTO/config/test_data/simplemaps-worldcities-basic.csv"
    }
}
```

This section has two required properties `ScriptPath` and `Config`.
 
#### 2.3.1. ScriptPath

This property identifies the JavaScript plug-in implementing the custom importer that should be loaded.
This can either be an absolute path or a relative path relative to the applications working directory.

#### 2.3.2 Config

This property contains properties specific to the importer plug-in. Unlike the `Config` for
[rules](#2.2.3.-config) this cannot reference a separate file.

### 2.4. export _(Optional)_

The `export` section is used to describe a custom exporter. Custom exporters, similar to custom importers,
allow saving generated files and logs to a location other than the local file system.

This is an example of an `export` property.

```json
"export" : {
    "ScriptPath": "/opt/PLUTO/config/export.js",
    "Config" : {
        "file": "/opt/PLUTO/config/tmp/simplemaps-worldcities-basic.csv.out"
    }
}
```

The `export` property has exactly the same properties as the `import` property.

## 3.0. Overrides

The validator has a command line option, `-v/--rulesetoverride`, which is used for overriding the importer
or exporter configuration. This is necessary when a ruleset has been defined with an importer and/or exporter
that references one file
but you want it to operate on a different file, or output a different file, or use different credentials, etc.

An override has two properties `import` and `export`. Both are optional. If specified they should contain
 overriding `Config` properties for the `import` and `export` properties in the ruleset.
 
For example:
```json
{
    "import" : {
        "file": "/opt/PLUTO/config/test_data/factories.csv"
    },
    "export" : {
        "file": "/opt/PLUTO/config/tmp/factories.csv.out"
    }
}
```

## 4.0. Example

Below is an example ruleset demonstrating all the properties of a ruleset and it's nested objects.

```json
{
	"RuleSet" : {
		"name" : "Test Data RuleSet",
		"rules" : [
			{
				"FileName" : "CheckColumnCount",
				"Name" : "Validate column count",
				"Config" : {
					"Columns" : 9
				}
			},
			{
				"FileName" : "CheckLatLong",
				"Name" : "Validate Lat & Long",
				"Config" : {
					"NumberOfHeaderRows" : 1,
					"LatitudeColumn"  : 2,
					"LongitudeColumn" : 3
				}
			},
			{
				"FileName" : "CheckColumnType",
				"Name" : "Validate Population Column",
				"Config" : {
					"NumberOfHeaderRows" : 1,
					"Type" : "number",
					"Column" : 4
				}
			}
		],
		"import" : {
			"ScriptPath": "/opt/PLUTO/config/import.js",
			"Config": {
				"file": "/opt/PLUTO/config/test_data/simplemaps-worldcities-basic.csv"
			}
		},
		"export" : {
			"ScriptPath": "/opt/PLUTO/config/export.js",
			"Config" : {
				"file": "/opt/PLUTO/config/tmp/simplemaps-worldcities-basic.csv.out"
			}
		}
	}
}
```

[rules]: docs/rules.md
[validator]: docs/validator.md
