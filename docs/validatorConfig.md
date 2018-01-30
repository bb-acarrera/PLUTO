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
	"runMaximumDuration": 600
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
            "filename": "a reporter", //the name of the reporter as specified in the manifest
            "config": {} //all the configuration specific to this reporter
        }
    ]
```

### smtpReporter
The smtpReporter is a reporter plugin included with the default PLUTO that can be used to send email summaries of processed
files. The configuration in validatorConfig.json should look like:

```
{ ...
    "reporters": [
		{
			"filename": "smtpReporter",
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

## runMaximumDuration
The maximum amount of time (in seconds) a run can take to process a file. When exceeded, the server will terminate the run. Default is 600 seconds.