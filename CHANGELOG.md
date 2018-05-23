# PLUTO Change Log

## 1.0.11
### New Features

#### Hide Properties
Added ability to hide properties. (See the bottom of validatorConfig.md.)

#### Show File Details in UI (#442)
The Upload and Download sections of the UI now show the name of the file and where it is.


### Bug Fixes and Minor Improvements
* Fixed "Validation setup not reading default name" (#549)
* "Validation setup not reading default name" (#550) is a duplicate of #549 so was also fixed.
* I can't reproduce "Validation configuration changes do not save after an upload" (#551) and believe
it was an artifact of #549 and therefore fixed.
* I can't reproduce "Processing icon appears on newly added file" (#553) and believe
it was an artifact of #549 and therefore fixed.


## 1.0.10
### New Features

#### Post Upload Tasks
Added a new class of tasks that execute after the file has been successfully uploaded. Uses the same plugin infrastructure as rules, and appear as a list of items below the rules in the edit validation UI.

#### RabbitMQ Queuing of Jobs
Added a job queue (using RabbitMQ) and a validation worker service/container that can be configured to handle the job queue instead of running jobs on the web server.


### Bug Fixes and Minor Improvements
 * Fixed export validation problem related to inconsistent versioning between systems
 * Added hungRunPollingInterval property (can be set in validatorConfig.json) which controls the frequency (6 hours by default) that the database is queried for hung jobs (jobs which are still marked as running after the runMaximumDuration has passed). Found hung jobs are immediately terminated. (#479)
 * Added additional console reports on edit operations. (#507)
 * Jobs are allowed to complete (or timeout) when the server receives a SIGTERM signal. (#512)
 * Added ability to populate UI dropdowns from a JavaScript function on the server
 * Added option to queue validation jobs in RabbitMQ to be run by a separate worker instead of directly on the web server
 * A note was added above the Edit Validation "Save" button when any of the input fields fails validation. (#519)
 * Modified how responses from external processes are received. Should avoid incorrect parsing of JSON responses. (#529)
 * Warn users about unsaved changes when navigating with the browser buttons.
 * Added property value overrides for UI items from the validator config.

## 1.0.9
### New Features

#### Shapefile parsing

PLUTO can now natively parse shapefiles, and all core cvs rules can operate against the shapefile attributes table. Shapefiles can be supplied as a zip, which PLUTO will unzip, validate, and re-zip before uploading, with an option to make the zip contets filenames match the zip filename. It has options to remove all non-shapefile files, and to rename the contents to match the output file name. 

### Bug Fixes and Minor Improvements
 * Added ability for administrators to assign validations to different groups
 * Added a proper label to parsers
 * Added ability to assign custom fields to groups
 * Changed required rules to be per-parser (specifically so validations with 
 * Added config option to restrict access to the admin page to only administrators 
 * Added config option to show a link to the admin page if the user is an administrator
 

## 1.0.8
### New Features

#### Required Rules
Globally required rules can now be specified in the validatorConfig.json, including specific properties. Validations that are missing required rules (or the required config) will fail and new validations will have the required rules automatically added.

### Bug Fixes and Minor Improvements
 * Fixed problems reporting the correct row number when there are an inconsistent number of columns
 * Added the api folder to the PYTHONPATH in the containers, so the PLUTOAPI path can be deprecated
 * Changed the python api to be expected in the PYTHONPATH, as well as adding the api folder to PYTHONPATH in the Docker container
 * Changed rule setup workflow in the validator to support non-parser rules (e.g. unzip a csv)
 * Fixed clone pop-up show the validation id, now shows name
 * Set the Python module Request to version 2.18.4 in the containers
 * Added client validations to the validation general config and base rule properties
 * Fixed error in the environment variable replacement with non-strings
 * Added environment variable replacement support to the database loader scripts
 * Disable export button if validation is not valid
 * Only show the export button if the remote host URL is set
 * Improved the error messaging on unhandled validator exit
 * added a new UI property type 'largestring' to support multi-line text

## 1.0.7
### New Features

#### Validation Summary
Added a new page off of the validations list from the "Summary" button, which shows a summary of the validation.

#### Validation Export/Import
Added the ability for a PLUTO instance to export validations to another PLUTO instance.

### Bug Fixes and Minor Improvements
 * added a docker reference stack (with logging, performance metrics, ElasticSearch, and Kibana)
 * Cleaned up logging from the web service to allow easier ingestion by Filebeat
 * Added run summary details to web service output log
 * Fix bug on disabled create validation continue button
 * Cleaned up layout of config fields in UI
 * Hide the Additional Information if there are none configured
 * Added limit on number of concurrent running validations in a service
 * Added environment variable replacement support to all strings inside validatorConfig.json

## 0.9.6
### New Features

#### Custom Validation Fields
Added the ability to specify custom properties in the validator config that will appear as fields on the validations under a "Additional Information" section.

#### Better Reporters support
 * added titles to each reporter
 * added config option to limit when to send reports per reporter (only on fail, on fail or warning, always)
 * added support for multiple reporters of the same type (e.g. multiple emails)
 
#### Basic Expected File Change Frequency
Added two fields to the validation to allow users to specify how often the file is expected to update, and a new icon in the validation list showing if a file is out of date.

### Bug Fixes and Minor Improvements
 * Cleaned up some rule defaults
 * Added user and group ids to runs for person who executed job
 * Shorten text that is too long on lists
 * Sorted the rules list alphabetically
 * Fixed client validations not executing against new rules
 * Some cleanup of the Validations page layout when the window is narrow

## 0.9.5
### New Features

#### Validation order enforcement and handling bad validations
For a specific ruleset, order of execution is now enforced across the system -- the first request to process will be the first file uploaded. This is to prevent newer files getting overwritten by older files in a heterogeneous environment where some servers running the validator server are much slower than others. Before the validator uploads the validated file, it will check to see if there are any other validations for the same file already running that were started earlier and will wait (by polling the database on a regular interval -- controlled by the validatorConfig property runPollingInterval which defaults to 10 seconds) until those other validations complete.

To prevent validations from waiting indefinitely, a maximum run duration has been introduced (controlled by the validatorConfig property runMaximumDuration which defaults to 600 seconds). The PLUTO server that starts a validation will terminate the process (and update the run record) after the maximum duration is exceeded. In cases where the server terminated unexpectedly, the waiting run will compare the start time of the run it's waiting for against the maximum duration plus 30 seconds and marked it as finished and continue if exceeded.

#### Pass-through validations
When adding a new file to validate, under the create button is an option to create the validation without validating the file. No rules can be added to these validations, and the validator will only download and upload the file and report the results.

### Bug Fixes and Minor Improvements
 * Fixed rulesets using a parser that start with (or only have) external process rules not getting the pre-work (e.g. original row id column was not added by the CSV parser)
 * Rules that require a specific parser no longer appear in the list of available parsers if that parser is not part of the validation
 * Switched Python CSV API to use Pandas to parse csv
 * Added a new Python base class which gives Pandas Dataframes instead of rows
 * Shutting down server will now clean-up running jobs gracefully
 * Fixed some instances where changing the validation won't force the user to save before testing or uploading
 * Improved memory performance of Python CSV rules 

## 0.9.4
#### New Features

#### Bug Fixes and Minor Improvements
 * Added "PLUTOCONFIG" environment variable to the pluto container, which maps to the pluto config folder for use by plugins
 * Removed # from reporter url link to run details
 * show newlines in errors
 * Fixed error message
 * Handle missing source or target when loading run details
 * Build improvements
 * Wait for response before closing create pop-ups
 * Return error on processFile if too many rulesets found
 * Checks to see if the validation needs to run again now include changes to the target/upload
 * Improved external process rules support
 * Added Python 2.7 CSV parser base rule class
 * More documentation

## 0.9.3
#### New Features

#### Bug Fixes and Minor Improvements
 * Changed upload/download list buttons to text
 * Clicking outside of create pop-ups won't close the pop-up
 * Added rule class to run details error list
 * Added ISO 8601 DateTime type to check column type
 * Prevent deletion of upload and download locations if they're in use
 * Fixed some filters on lists not resetting back to the first page
 * Added base selection to create upload/download pop-up
 * Prevent an upload or download from being created if the description is the same


## 0.9.1
#### New Features
##### processfile api supports source file
Added a new option to the API to start processing a file based on the source/download file name and path instead of the ruleset id. Called the same way as before but with the body json:
``
{
  "source_file": "worldcities.csv"
}
``
The above example would search for a ruleset/validation that has a source/download file as `worldcities.csv`. It searches for an exact match on the full path entered in validation-> Download from->File path.

processfile will now return a 404 if the ruleset can't be found (either by ruleset or source_file).

##### md5 hash check before validating and uploading
Validating files via the processfile API will now perform an md5 hash check. After the valdator downloads the file, it will compute an md5 hash and check it against the last validation of this file. If the hash is the same, and the validation config is the same the validation is stopped and no reports will be sent. If a user starts a validation via the `Upload` button on the UI, they will get run details indicating that the file was the same, but skipped validations will not appear in the `File load status` list.

#### Bug Fixes and Minor Improvements
 * Fixed bugs related to editing and using upload and download configs
 * use window.location.origin if there is no base url configured
 * Improved wording of "target" in the run details
 * Fixed smtp reporter exception when no config
 * Fixed error with blank value in source overriding the value supplied in the ruleset
 * Fixed ruleset still appearing in the list after a delete
 * Show the run id in the runs list and on the run details page