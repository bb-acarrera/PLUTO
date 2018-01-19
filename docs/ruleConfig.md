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
All the configuration for the current parser. The "name" property is always supplied if there is a parser and is the name of the parser. The rest of the properties are the configuration for the specific parser. For JavaScript rules, the parser wrapper uses this to parse the file and pass an array for each row to the rule. For external rules, these properties need to be used to parse the file. 

For the CsvParser, the properties are:
```json
{
    "name": "CSVParser",
	"numHeaderRows": "1",
	"columnRow": 1,
	"delimiter": ",",
	"quote":"\"",
	"escape": "\"",
	"comment": ""
}
```

## name
The name of the parser.  This will be included with all parsers.

## numHeaderRows
The total number of header rows.  The is used by rules that only validate data, so the header rows can be skipped.

## columnRow
The row index of the row that contains the column names. First row is 1. Value can be 0 or not exist if there is is no column name row. Used by rules that need to validate the column names.  The list of column names is also supplied by the parserState object.

## delimiter
The delimiter character used.

## quote
The character to quote a field, causing the delimiter to be ignored.

## escape
The character used to excape the quote character.

## comment
The character used to mark a line as ignored.  Blank or not supplied if not used.



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
