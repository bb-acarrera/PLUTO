# PLUTO Change Log

## 0.9.7
### New Features

### Bug Fixes and Minor Improvements


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