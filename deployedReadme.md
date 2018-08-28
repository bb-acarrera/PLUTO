# Configuring PLUTO
This describes how to configure and deploy PLUTO.

## Quick Start
1. Pull latest pluto and pluto_dbloader into your local repo (either from uncharted/pluto and uncharted/pluto_dbloader on Docker Hub or by building from source as described on the PLUTO github page and tagging as latest)

2. Run `initPluto.sh` to start the pluto database and the "pluto" container using the sample_config configuration

3. See the config UI via http://localhost:3000

## Configuring
All configuration properties are in validatorConfig.json. When the built container is started via `initPluto.sh`, 
it loads the validatorConfig.json from the root of `sample_config`. 

Validator config structure and properties can be found [here][validatorConfig]

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
  * AUTH-GROUP - A ";" delimited list of groups the user is authorized for.  When the user creates an item they will be asked which group in AUTH-GROUP they would like to assign as the owner.  Only users with that  
  group (or admin users) will be allow to make changes to this item.
  * AUTH-ADMIN - if set to "t" or "true" this user is designated as an admin, and can make changes to any item


[validatorConfig]: docs/validatorConfig.md