# Rule Configuration Properties

Each rule which is called by the validator will be passed a `config` object. This config object
is initialized with properties from the ruleset file. After this it is updated with a set of common
properties. Generally these properties allow the rule to locate commonly shared resources.

```json
{
	"id": "...",
	"name": "...",
	... Rule Properties ...
	"parserConfig": {...},
	"parserState": {...},
	"validatorState": {...},
	"importConfig": {...},
	"exportConfig": {...},
	"attributes": { ...	}
}
```

# id
The id of the instance of this rule. 

#name
The name of the rule as specified in the manifest.

# Rule Properties
The configuration properties for this rule as specified in the UI by users. Details on how to specify the configuration is defined in [external rules][externalProcessRules] or [JavaScript rules][javascriptRules]. All configuration properties appear at the top level of the object if defined.

# parserConfig
All the configuration for the current parser.

# parserState
Specific state information for the current parser. 

For the CsvParser, this includes the property `columnNames`, which is the list of the current columns in the file (including added or deleted columns by previous rules) in an ordered array where the first element in the array is the first column in the file.


# validatorState

```json
"validatorState": {
		"rootDirectory": "...",
		"tempDirectory": "...",
		"encoding": "..."
	}
```

## rootDirectory

The `rootDirectory` property is a string which is an absolute path to the root of the validator install.
All resources exist in directories below this one.

## tempDirectory

The `tempDirectory` is a directory that exists for the duration of the current ruleset run. It is created
at the start of the run and it and its contents are deleted at the completion of the run. Rules can place
any temporary data here. Rules should not modify anything that might already exist in this directory as
the validator places its own temporary files here.

## encoding

This is the data encoding on the input data to the rule. By default this is '`utf8`' but may be something
else if the a previous rule has changed it or a different encoding was specified when starting the
validator.

# importConfig
All configured properties for the importer. Intended for use by specialized rules for double-checking configuration.

# exportConfig
All configured properties for the exporter. Intended for use by specialized rules for double-checking configuration.

# attributes
General attributes of this rule as defined by the configuration (details in [external rules][externalProcessRules] or [JavaScript rules][javascriptRules]).

[externalProcessRules]: externalProcessRules.md
[javascriptRules]: javascriptRules.md
