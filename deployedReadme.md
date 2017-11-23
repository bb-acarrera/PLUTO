# Configuring PLUTO
This describes how to deploy and configure PLUTO.

## Quick Start
1. Pull latest pluto and pluto_dbloader into your local repo (either from uncharted/pluto and uncharted/pluto_dbloader on Docker Hub or by building from source and tagging)

2. Run `initPluto.sh` to start the pluto database and the "pluto" container using the sample_config configuration

3. See the config UI via http://localhost:3000

## Configuring
All configuration properties are in validatorConfig.json. When the built container is started via `initPluto.sh`, 
it loads the validatorConfig.json from the root of `sample_config`. The properties are:

#### configHost
The hostname of the sever host the PLUTO web server.  This is used by the emailer when generating links to processed files.

#### configHostProtocol
The protocol to use in generated links to the PLUTO web server. Defaults to "http" if not set.

#### smtpConfig
This configures the connection to the smtp server so that emails can be sent from the validator once processing is complete.
PLUTO uses Nodemailer's (https://nodemailer.com) smtp transport, and smtpConfig is passed directly to createTransport. 
Details on configuration can be found at https://nodemailer.com/smtp/

#### emailFrom
This is what will appear in the From on sent emails

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
