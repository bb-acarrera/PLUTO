# Configuring PLUTO
This describes how to configure and deploy PLUTO.

## Quick Start
1. Pull latest pluto and pluto_dbloader into your local repo (either from uncharted/pluto and uncharted/pluto_dbloader on Docker Hub or by building from source as described on the PLUTO github page and tagging as latest)

2. Run `initPluto.sh` to start the pluto database and the "pluto" container using the sample_config configuration

3. See the config UI via http://localhost:3000

## Configuring
All configuration properties are in validatorConfig.json. When the built container is started via `initPluto.sh`, 
it loads the validatorConfig.json from the root of `sample_config`. The properties are:

#### rulesDirectory
The folder where the manifest for the custom rules is located. It's expected that the custom rules are located in this folder, but not required. For more details on custom rules see TBD.

#### tempDirectory
The folder where a temporary files created by the validator should be placed.

#### dbUser
User to use for connecting to the Postgres database. `initPluto.sh` uses this to create the database if none exists. Default is `pluto`

#### dbPassword
The password for dbUser. `initPluto.sh` uses this to create the database if none exists. Default is `password`.

#### dbDatabase
The name of the database to connect to. `initPluto.sh` uses this to create the database if none exists. Default is `pluto`.

#### dbHost
The hostname or ip address of the server hosting the database. There is no default.

#### dbPort
The port that Postgres is listening on. `initPluto.sh` uses this as the port to expose to the database. Default is `5432`.

#### dbSchema
The Postgres schema that all PLUTO tables, views, etc. in the database should exist under. Defualt is `pluto`.

#### configHost
The hostname of the sever host the PLUTO web server.  This is used by the emailer when generating links to processed files.

#### configHostProtocol
The protocol to use in generated links to the PLUTO web server. Defaults to "http" if not set.

#### reporters
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

##### smtpReporter
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

###### smtpConfig
This configures the connection to the smtp server so that emails can be sent from the validator once processing is complete.
PLUTO uses Nodemailer's (https://nodemailer.com) smtp transport, and smtpConfig is passed directly to createTransport. 
Details on configuration can be found at https://nodemailer.com/smtp/

###### emailFrom
This is what will appear in the From on sent emails

#### rulesetDirectory
Folder where sample validations, upload configurations, and download configurations are stored that are use by the pluto_dbloader.

#### rootDirectory
A base folder that can be used as the root for other folders like rulesDirectory, rulesetDirectory and tempDirectory. If they're specified as relative, they'll be relative to the rootDirectory. For production, it's recommended to use absolute paths for these folders.

## Processing a file

To process a file, POST to `http://localhost:3000/processfile` with a json package. At a minimum, it must specify a ruleset to execute:

```json
{
	"ruleset": "worldCities"
}
```
And can be call via:

```
curl -d '{"ruleset": "worldCities"}' -H "Content-Type: application/json" -X POST http://localhost:3000/processfile
```

## Authentication
Pluto requires authorization to be done externally (e.g. with NGINX), but it can use auth information for limiting
write access to things users create. To use this feature, the upstream authentication can add additional request headers:
  * AUTH-USER - the user id of the current user, used to track who made changes to items
  * AUTH-GROUP - when the user creates an item, the owner is set to the value of AUTH-GROUP, and only users with that
  group (or admin users) will be allow to make changes to this item
  * AUTH-ADMIN - if set to "t" or "true" this user is designated as an admin, and can make changes to any item
