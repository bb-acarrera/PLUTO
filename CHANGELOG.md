# PLUTO Change Log

## 0.9.2
#### New Features

#### Bug Fixes and Minor Improvements



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