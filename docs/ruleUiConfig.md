# Rule User Interface Configuration

In order for users to be able to configure rules in a validation/ruleset basic information (e.g. title, description, etc.) as well as per-property information. There are differences in how this is down for JavaScript rules and external rules, but most of the structure is the same.

## JavaScript Rules
The differenct aspects of the configuration (descriptions, config properties, and config defaults) are exposed through three static functions on the class. Details on building JavaScript rules can be found [here][javascriptRules].

## External Rules
For an external process rule the description of the rule's UI is done within a separate JSON file. Details on how to map an external rule to the configuration file can be found [here][externalProcessRules]. The json should be an array of objects, with one object for each config property, plus a final object containing the descriptions.

For example:
```json
[
	{
		"name": "regex",
		"label": "Regular Expression",
		"type": "string",
		"tooltip": "The regular expression to use to validate the filename.",
		"default": ""
		"validations": [
			{
				"length": {
					"min": 1
				}
			}
		]
    },
	{
		"title": "Check Filename",
        "shortdescription": "Validate the name of the source file.",
		"longdescription": "This rule validates the name of the source file against a regular expression. An error is reported if the filename fails to match the regular expression.",
		"changeFileFormat": false
	}
]
```

## Config Properties
Each object in the list describes a single property that is exposed to the user for configuration.  It's expected properties are:
```json
{
	"name": "regex",
	"label": "Regular Expression",
	"type": "string",
	"tooltip": "The regular expression to use to validate the filename.",
	"default": ""
	"validations": []
}
```

### name
The internal name of the property. This will match the property name on the config object that is passed to the rule during execution. This field is required and must be a unique (to this rule), non-empty string.

### label
The string used in the UI placed before the entry field. Not required, but should be short and descriptive. If it's not supplied the name will be used.

### type
The property type, which will determine the kind of entry field shown to the user. Can be one of:
 * boolean
 * choice
 * column
 * date
 * integer
 * list
 * number
 * string
 * time

If the type isn't set or doesn't match this list, then the string type is used.

#### boolean
Displays a check-box, if the value doesn't exists will be unchecked.

#### choice
Displays a dropdown, and an array of choice objects under the property `choices` must be supplied. For example:
```javascript
{
	name: 'type',
	label: 'Column Type',
	type: 'choice',
	choices: [
		{value:'string', label:'String'},
		{value:'float', label:'Float'},
		{value:'integer', label:'Integer'},
		{value:'iso_8061_datetime', label:'ISO 8601 Datetime'}
	],
	tooltip: 'The expected data type of the given column.'
}
```
 Where each choice object must have 2 properties:
 **value** is the property value to use for this choice
 **label** is the label to display in the dropdown for this choice
 
 If the current property value does not match any values under the `choices` array or the value not present and no default is supplied, the current value will display as `Choose`.
 
#### column
Similar to the choice, a dropdown will be displayed, but the options will the the column names as defined in the parser. It is not recommended that a default be specified.
 
#### date
Will display a `date` entry field, and use the browser default date selector.
 
#### integer
Will display a browser defualt number entry field with an increment of 1.
 
#### list
Will display a standard text entry field, but expects a comma-separated list of values. Is used by the csv parser colunm names property.
 
#### number
Will display a browser defualt number entry field with an increment of 0.01.

#### string
Will display a standard text entry field

#### time
Will display a browser default time entry field.

### tooltip
A more descriptive string for this property.  Will appear as a tooltip when the user hovers over the label in the UI.

### default
Only used by external rules (defaults are handled differently for JavaScript rules), and is the default value that appears in the entry field when a new instance of the rule is created in the UI.

### validations
An array of validation objects to validate the value of the property in the UI. Details on how to configure the validation can be found at https://github.com/poteto/ember-changeset-validations#validator-api. The key difference is that for each validation object, there should be a single property (e.g. length), which will get converty to a `ember-changeset-validations` validator function (e.g. validateLength), and the sub-object are the expected properties for that validator function. 


## Descriptions
The descriptions object is used for describing the rule. It's expected properties are:

```json
{
	"title": "Check Filename",
    "shortdescription": "Validate the name of the source file.",
	"longdescription": "This rule validates the name of the source file against a regular expression. An error is reported if the filename fails to match the regular expression.",
	"changeFileFormat": false
}
```

### title
The string used in the rule selector drop-down as well as the in the title bar section of added rules. If not present, the name from the manifest will be used. Should be a unique, short, non-empty string.

### shortdescription
A short tooltip for the rule that will appear when hovering over the title text in the Validation Setup page.

### longdescription
A detailed description of the rule that will appear as an info icon.

### changeFileFormat
Currently only used by external rules, setting this value to true will indicate that this rule will convert the file from one format to another (e.g. geojson to csv).  This is necessary so any parser-specific added data (e.g. original line numbers from the source csv) will be removed before this rule executes.

[externalProcessRules]: externalProcessRules.md
[javascriptRules]: javascriptRules.md