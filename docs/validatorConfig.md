#ValidatorConfig

`validatorConfig.json` is used by the PLUTO web server as well as the validator for configuration. It should provide
information on how to connect to its database, where the rules manifest is located, where to put temporary files, and
some other information.  The sample config looks like:

```
{
	"rulesDirectory" : "/opt/PLUTO/config/customRules",
	"tempDirectory" : "/opt/PLUTO/config/tmp",
	"dbUser" : "pluto",
	"dbPassword" : "password",
	"dbDatabase" : "pluto",
	"dbHost" : "192.168.0.1",
	"dbPort" : "5432",
	"configHost": "localhost:3000",
	"configHostProtocol": "http",
	"reporters": [
		{
			"filename": "smtpReporter",
			"config": {
				"emailFrom": "\"PLUTO\" <no-reply@localhost>",
				"smtpConfig": {}
			}
		}
	],
	"rulesetDirectory" : "/opt/PLUTO/config/rulesets",
	"rootDirectory" : "/opt/PLUTO/config",
	"runPollingInterval": 10,
	"hungRunPollingInterval": 21600,
	"runMaximumDuration": 600,
	"customValidationFields": [
        {
            "name": "custom",
            "label": "Custom Field",
            "tooltip": "Custom Field",
            "type": "string"
        }
    ],
    
    "forceUniqueTargetFile": true,
    
    "exportRulesets" : {
    		"exportToLabel": "Production",
    		"hostBaseUrl": "http://localhost:3000"
    },
    
    "allowOnlyRulesetImport": false,
    
    "environmentLabel": "Development",

	"rabbitMQ" : {
		"protocol": "amqp",
		"hostname": "localhost",
		"port": "5672",
		"username": "guest",
		"password": "guest"
	},
	"useRabbitMQ": true,
    
}
```

Environment variables can be inserted into any string via "${MY_ENV_VAR}". E.g.:

```
{
    "dbPassword" : "${PLTUO_DB_PASSWORD}"
}
```

with the environment variable `PLUTO_DB_PASSWORD` set to `superSecretPassword` result in:

```
{
    "dbPassword" : "superSecretPassword"
}
```

## rulesDirectory
The folder where the manifest for the custom rules is located. It's expected that the custom rules are located in this folder, but not required. For more details on custom rules see TBD.

## tempDirectory
The folder where a temporary files created by the validator should be placed.

## dbUser
User to use for connecting to the Postgres database. `initPluto.sh` uses this to create the database if none exists. Default is `pluto`

## dbPassword
The password for dbUser. `initPluto.sh` uses this to create the database if none exists. Default is `password`.

## dbDatabase
The name of the database to connect to. `initPluto.sh` uses this to create the database if none exists. Default is `pluto`.

## dbHost
The hostname or ip address of the server hosting the database. There is no default.

## dbPort
The port that Postgres is listening on. `initPluto.sh` uses this as the port to expose to the database. Default is `5432`.

## dbSchema
The Postgres schema that all PLUTO tables, views, etc. in the database should exist under. Defualt is `pluto`.

## configHost
The hostname of the sever host the PLUTO web server.  This is used by the emailer when generating links to processed files.

## configHostProtocol
The protocol to use in generated links to the PLUTO web server. Defaults to "http" if not set.

## reporters
Reporters are plugins that send a summary of a processed file's results, such as sending an email. By default, PLUTO
comes with an email reporter that can be configured to connect to an smtp server to send emails.

On the config object, reporters must be an array of object, with each object being a unique reporter type. You can learn
more about building custom reporters (or other plugins) in the Plugins documentation (TODO). The structure should look like:

```
{ ...
    "reporters" : [
        {
            "filename": "a reporter", 
            "title": "Summary Email", 
            "sendOn": "always", 
            "id": 0,
            "config": {} 
        }
    ]
```
The properties are:
#### filename
The name of the reporter plugin to use, as specified in the manifest.  Pluto include "smtpReporter" to send emails to a SMTP server.

#### id
Required if there is more than one reporter. A unique number to use for the reporters, so Pluto can properly hook up the UI properties to the saved values in a validation. 

#### config
The custom configuration for the reporter plugin. See smtpReporter below for configurtion of the smtpReporter plugin.

#### title
The title to display in the UI for this reporter.

#### sendOn
By default, Pluto will always send a report.  This property specifies when to send reports:
 * "always": Always send a report (default)
 * "failed": Only send reports if the processing job failed
 * "warned": Send reports if the processing job failed, or if there were warnings or dropped rows

### smtpReporter
The smtpReporter is a reporter plugin included with the default PLUTO that can be used to send email summaries of processed
files. The configuration in validatorConfig.json should look like:

```
{ ...
    "reporters": [
		{
			"filename": "smtpReporter",
			"title": "Summary Email",
			"sendOn": "always",
			"id": 0,
			"config": {
				"emailFrom": "\"PLUTO\" <no-reply@localhost>",
				"smtpConfig": {}
			}
		}
	]
}
```

It's properties are:

#### smtpConfig
This configures the connection to the smtp server so that emails can be sent from the validator once processing is complete.
PLUTO uses Nodemailer's (https://nodemailer.com) smtp transport, and smtpConfig is passed directly to createTransport. 
Details on configuration can be found at https://nodemailer.com/smtp/

#### emailFrom
This is what will appear in the From on sent emails

## rulesetDirectory
Folder where sample validations, upload configurations, and download configurations are stored that are use by the pluto_dbloader.

## rootDirectory
A base folder that can be used as the root for other folders like rulesDirectory, rulesetDirectory and tempDirectory. If they're specified as relative, they'll be relative to the rootDirectory. For production, it's recommended to use absolute paths for these folders.

## runPollingInterval
The frequency (in seconds) that a run will check if older runs processing the same file are finished. Default is 10 seconds.

## hungRunPollingInterval
The frequency (in seconds) that the server will check for runs that have failed to mark themselves complete. Default is 21600 seconds (6 hours). If this is 0 then the check is not done.

## runMaximumDuration
The maximum amount of time (in seconds) a run can take to process a file. When exceeded, the server will terminate the run. Default is 600 seconds.

## customValidationFields
Additional fields that appear in the validation setup (under Additional Information) that can be used as meta-data or other information, but is ignored by the validation engine.   

```
{ ...
    "customValidationFields": [
        {
            "name": "custom",
            "label": "Custom Field",
            "tooltip": "Custom Field",
            "type": "string"
        },
        {
            "name": "custom2",
            "label": "Custom Field 2",
            "tooltip": "Custom Field 2",
            "type": "integer"
        }
    ],
}
```
Each field is an object in the customValidationFields array, with the properties describing the field. See the Config Properties section of the [Config Properties] page for details on the fields specification.

Alternatively the fields can be wrapped in an object with a group name and content, visually separating the properties into the subsections.
```
{ ...
    "customValidationFields": [
		{
			"group": "Additional Fields",
			"contents" :
			[

				{
					"name": "summary",
					"label": "Data Summary",
					"tooltip": "Brief description of this data",
					"type": "string"
				},
				{
					"name": "source",
					"label": "Source",
					"tooltip": "Where did this data come from?",
					"type": "string"
				}
			]
		},
		{
			"group": "Even More Additional Fields",
			"contents" :
			[
				{
					"name": "code",
					"label": "Code",
					"tooltip": "Code",
					"type": "integer"
				},
				{
					"name": "public",
					"label": "Public",
					"tooltip": "Public",
					"type": "boolean"
				}
			]
		}
	]
}
```

## forceUniqueTargetFile
If set to true, each validation must have a unique target file name across all uploads, and users will get an error if they attempt to create a duplicate.

## maxConcurrentTasks
Maximum number of allowed concurrent jobs. Cancels the incoming task and returns http error if exceeded. 

## exportRulesets
Configuration for exporting rulesets/validations another instance of PLUTO.  When set, a button titled "Export to ${exportToLabel}" will appear on the Edit Validation page and allow users to copy the current ruleset to that instance.  The endpoints used to obtain configured rules and to import the rules can be configured as well via the "configuredRulesPath" and "importRulesetPath" respectively.  These two options are optional and have default values if not specified.  "configuredRulesPath" will default to "api/v1/configuredrules" if not specified.  "importRulesetPath" will default to "api/v1/importruleset" if not specified.

``` json
    "exportRulesets" : {
    		"exportToLabel": "Production",
    		"hostBaseUrl": "http://localhost:3000",
    		"configuredRulesPath": "api/v1/configuredrules",
    		"importRulesetPath": "api/v1/importruleset"
    	}
```

### exportToLabel
The label to use for the other instance, and will appear in the export button.

### hostBaseUrl
The base url to the app server of the other PLUTO instance

## allowOnlyRulesetImport
If set to true, users will be unable to add or edit rulesets (but will be able to delete). The only way rulesets can be added or changed is via export from another instance.
  
## environmentLabel
A label to use to identify this PLUTO instance, and is appended to the title of every page.

## environmentStyle

Configuration for styling background and border color of different PLUTO instances. Configuration matching current environmentLabel will be used. Values on properties must match valid CSS attributes.
Images for "landingImage" must be valid urls.

``` json
    "environmentLabel" : {
		"Production": {
			"backgroundColor": "#FEE1E1",
			"borderColor": "red",
			"borderWidth": "4px",
			"landingImage": "release.png"
		},
		"Development": {
			"backgroundColor": "white",
			"borderColor": "",
			"borderWidth": "0px"
		}

	}
```

## showAdmin
If set to true, admin button will be shown on the main page.

## rejectAdminNavigation
If set to true, non admins would not be permitted to navigate to the admin page.

## requiredRules
```
{ ...
    "requiredRules": [{
		"parser" : "CSVParser",
		"rules" : [
			{
				"config": {
					"orderMatch": "ignore",
					"extraColumns": "Warning",
					"missingColumns": "Error"
				},
				"filename": "CheckColumnNames"
			}
		]
	}]
}
```
A list of rules with their matching parser that must be present on every validation, and if not present the validation will fail. Any validation created will have these rules automatically added. Each object in the list represents a single rule with the properties:

 - **filename**: this is the id of the rule, as defined in the rules manifest.  This property must be set to a valid rule id.
 - **config**: is an optional object that specifies what values the rule config should have. Any missing required rule properties are can be set by the user to any value; if a validation rule is missing any required properties then validation fails. If the config object is missing, then the user can set any rule values.

## rabbitMQ
````json
{ ...
"rabbitMQ" : {
		"protocol": "amqp",
		"hostname": "localhost",
		"port": "5672",
		"username": "guest",
		"password": "guest"
	},
	"useRabbitMQ": true,
}
````

An object which is the connection properties for the RabbitMQ service. See [amqplib's connect](http://www.squaremobius.net/amqp.node/channel_api.html#connect) for more details.
 * __protocol__ : `amqp` or `amqps`. Default is `amqp`
 * __hostname__ : hostname of the RabbitMQ service. Default is `localhost`
 * __port__ : RabbitMQ port. Default is `5672`
 * __username__ : RabbitMQ username. Default is `guest`
 * __password__ : Password for username. Default is `guest`

## useRabbitMQ
If set to true, the PLUTO web server(s) will use RabbitMQ to queue jobs, otherwise, it will run the jobs on the current web server. Default is false.


## propertiesOverride
```
{...
	"propertiesOverride": {
		"parsers": {
			"Parser Name" : {
				"Property Name": {
					"default": true,
					"disabled": true,
					"hidden" : true
				}
			}
		},
		"globalconfig": {
			"Property Name": {
				"default": 1,
				"disabled": true,
                "hidden" : true
			}
		},
		"posttasks": {
			"Property Name": {
				"default": 1,
				"disabled": true,
				"hidden" : true
		},
		"rules": {
			"Rule Name" : {
				"Property Name": {
					"default": 15,
					"disabled": true,
					"hidden" : true
				}
			}
        },
        "download" : {
			"Importer Name" : {
				"UI Property Name": {
					"hidden" : false,
					"disabled": true,
					"default": "some value"
				}
			}
		},
		"upload" : {
			"Exporter Name" : {
				"UI Property Name": {
					"hidden" : false,
					"disabled": true,
					"default": "some value"
				}
			}
		}
	}
}
```

Allows to set default values, disable or hide controls in parsers, global configuration and post task, download and upload sections of the edit ruleset page. Overrides for rules will be applied to all instances of that rule.

[Config Properties]: ruleUiConfig.md  
