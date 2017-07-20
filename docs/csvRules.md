# CSV Rules

[CSV](https://en.wikipedia.org/wiki/Comma-separated_values) rules expect that the input file will be a CSV file.
Properties in the rule's config allow modifying attributes of the CSV parser so that, for example, TSV (tab-separated
values) files can be processed.

## 1. Overview

CSV Rules are written in JavaScript (ES6). They should be derived from the `CSVRuleAPI` class which is defined in the
 `runtime/api` directory.

They should implement a constructor which takes a configuration object, and should
 implement the `processRecord(record)` method. They can validate the records, raising warnings and errors, and can
 modify the fields of a record.

## 2. Constructor

The CSV rule constructor takes a configuration object. This object is defined in the current ruleset's rules section
for the rule. Any properties that are required for the proper operation of the rule need to be defined
in this object.

## 3. `getValidatedHeaderRows(headerRowsProperty, headerRowsPropertyName)`
 
This is a convenience method for the constructor for processing the config. file. Most rules need to
know how many header rows there are which are then skipped when the records are processed. This method
 does all the validity tests on a config. property (existence, a number, etc.) and adds errors to the
 log if any are found in which case `undefined` is returned, otherwise a valid number is returned.
 
This method can be called with no arguments in which case it will look in the config. object for a
property named 'numberOfHeaderRows'.

Alternatively it can be called with two arguments, the first being the value to test for validity and
the second the name of property to print to the error log in the event of an error.

## 4. `getValidatedColumnProperty(propertyValue, propertyName)`

This is another convenience method for the constructor. Rules that require to know a specific column (ex.
to delete a column, or move a column) can use this method to get a column value from a config. file.
By default it checks a property called 'column' but this can be changed with the arguments, the first
 being a value to validate and the second being the name of the property to report to the error log in
 the event of an error.
 
This method checks if the value is a column label checking against `config.sharedData.columnLabels` and
if it is returns the matching column number. Otherwise this method checks that the value is valid
non-negative integer reporting errors if the value is anything else.

## 5. `processRecord(record)`
 
The rule's `processRecord(record)` method is called for each record in the CSV file, including comments and header
rows. The record will be an array of the fields in the record. The rule can then validate or modify the record. On
completion it should return the new (or original if no modifications occurred) record. 

## 6. `start()`

Rules can choose to implement this method if they need to do any work after the constructor but before
the first record is read. One example of this is rules, such as one that deletes columns, that needs
to modify the shared data, for example `sharedData.columnLabels`. Because rules using streams can be
run concurrently it is not safe to change metadata too late. Doing so could cause the order of changes
to be unpredictable.

## 7. `finish()`

Like `start()` a rule can implement a `finish()` method that is called after the last record has been
processed by `processRecord()`. This could include any clean up, freeing resources, etc.

## 8. Reporting Errors

CSV rules have built-in methods for reporting errors. These methods are `this.info(...)` for reporting low
priority information messages, `this.warning(...)` for reporting intermediate priority warning messages, and
`this.error(...)` for reporting high priority error messages. Each method takes a text string that should describe
the encountered situation. (More information on these methods is available in the description of [Basic Rules](basicRules.md).)

Logging error messages cause the validator to stop processing
following rules when any are reported so it is important to differentiate between a recoverable warning versus an
unrecoverable error.

## 9. CSV Config

In the ruleset's configuration for a CSV rule besides rule specific properties there are several which can be used
 to modify the behavior of the CSV parser. These are automatically picked up by the validator if they are included
 in the configuration object.
 
- delimiter - the delimiter character separating fields in a record. Defaults to a commma.
- comment - the comment character. Any text following this character is ignored. Ignored by default.
- escape - the single character used to allow the delimiter character to be used in a field. Defaults to a double quote.
- quote - the single character surrounding fields. Defaults to a double quote.
 
## 10. Example

This example is for a CSV rule which verifies that each row in a CSV file has the correct number of columns. The
expected column count is defined in the rule's configuration object (`config.columns`).

The constructor verifies
first that the columns declaration is valid, checking that it is defined and that it is an integer value greater
than zero. It also checks `config.reportAlways` to see if an error should be raised each time a row with the incorrect
number of columns is found or just the first time.

The `processRecord` method first checks that the rule was properly configured and if so checks the column count
of the current record against the expected count and reports an error if the counts differ.

It keeps a running count of the `rowNumber` assuming each record represents row in the CSV file. This is used in
the error message to point to the row in the CSV file that has the incorrect column count.

```javascript
const CSVRuleAPI = require("../api/CSVRuleAPI");

class CheckColumnCount extends CSVRuleAPI {
	constructor(config) {
		super(config);

		this.rowNumber = 0;

		// Verify that the config object is valid.
		this.columns = undefined;
		if (!this.config)
			this.error('No configuration specified.');
		else if (this.config.columns === undefined)
			this.error("Configured without a Columns property.");
		else if (isNaN(this.config.columns))
			this.error(`Configured with a non-number Columns. Got '${config.columns}'.`);
		else if (this.config.columns < 0)
			this.error(`Configured with a negative Columns. Got '${config.columns}'.`);
		else if (!Number.isInteger(parseFloat(this.config.columns)))
			this.error(`Configured with a non-integer Columns. Got '${config.columns}'.`);
		else
			this.columns = parseFloat(this.config.columns);

		this.badColumnCountReported = false;	// If a bad number of columns is found report it only once, not once per record.
		this.reportAlways = this.config && this.config.reportAlways ? this.config.reportAlways : false;	// Should every occurrence be reported?
	}

	processRecord(record) {
		if (this.columns) {
			if (record.length !== this.columns) {
				if (this.reportAlways || !this.badColumnCountReported) {
					this.error(`Row ${this.rowNumber} has wrong number of columns.`);
					this.badColumnCountReported = true;
				}
			}
		}

		this.rowNumber++;
		return record;
	}
}

module.exports = CheckColumnCount;
```