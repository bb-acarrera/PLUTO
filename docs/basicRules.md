# General Rules

General rules are the most general purpose rules and underlie the [Python Rules](pythonRules.md) and [CSV Rules](csvRules.md).
These rules can take in and export data in a number of different ways to allow rules to access data in a manner most
appropriate for them. The input file can be in any format, binary formats included.

## 1. Overview

The Python rules and CSV rules hide a lot of the functionality of rules, exposing only what is necessary for them to
function completely. General rules hide nothing and are therefore the most powerful and most complex to implement. If
a rule cannot be implemented as a CSV rule or a Python rule it can be implemented as a Basic rule. General rules provide
several different ways to access data so they can be quite efficient.

General rules are written in JavaScript (ES6) and they should be derived from the `RuleAPI` class which is defined in
the `runtime/api` directory.

The `RuleAPI` class is the base class for general rules. Rules should derive from this class which provides several
methods that derived classes may use or may need to override.

## 2. `info()`/`warning()`/`error()`

The `RuleAPI` class provides a few methods to classes deriving from it. These methods allow a rule to record warnings
and errors to the common log file. Each takes a single argument, a text message detailing something of importance. 

- `info(text)` is used to report low priority information to the log file. This could include the version of the rule,
values of properties the rule is using, etc.
- `warning(text)` is used to report medium priority information to the log file. This could include, for example, an
issue with the input file that isn't severe enough to stop validation.
- `error(text)` is used to report high priority information to the log file. This would include any information that
would cause more serious problems for following rules. If a rule reports any errors the validator will not execute
any rules following it.

## 3. Constructor

The general rule constructor takes a configuration object. This object is defined in the current ruleset's rules section
for the rule. Any properties that are required for the proper operation of the rule need to be defined
in this object.

## 4. `shouldRulesetFailOnError()`

By default if a rule will cause the ruleset to fail and stop processing more rules if a rule posts an error the log.
However if a rule would prefer that the ruleset continues despite posting an error then the rule should override this
method and have it return `false` instead of the default `true`.

The validator calls this method when an error is posted, not before. So a rule could choose to change the return
value of the function based on some criteria. For example a rule could have this method return `false` for all but
the last error. This way all errors in the input file are reported and not just the first one.

For example:
```javascript
shouldRulesetFailOnError() { return false; }
```

## 5. `run()`

Rules derived from `RuleAPI` or `MetadataRuleAPI` must implement a `run()` method. (Rules derived from
`CSVRuleAPI` use a different approach.) This performs all the actions required of the rule. This method
takes no arguments.

For metadata rules this method should check `this.config.sharedData` for any metadata it requires and
then modify it in place.

See [BaseRuleAPI](generatedDocs/BaseRuleAPI.html) for details on the rules' base class. See
[MetadataRuleAPI](generatedDocs/MetadataRuleAPI.html) for details on the metadata rule methods, and
 see [RuleAPI](generatedDocs/RuleAPI.html) for details on the methods required for a rule. (Again, if
 you are writing a rule to process CSV files you can ignore these files and see [CSV Rules](csvRules.md)
 and [CSVRulesAPI](generatedDocs/CSVRuleAPI.html).)

## 6. Example

This example demonstrates writing a `RuleAPI` rule. All it does it copy the input stream to the output
stream passing it through the `*nix` `cat` command. 
```javascript
const spawn = require('child_process').spawn;
const RuleAPI = require("../api/RuleAPI");

class RuleExampleUsingCat extends RuleAPI {
	constructor(config) {
		super(config)
	}

	run() {
		// Get the input stream to read from.
		let inputStream = this.inputStream;
		
		// Get an output stream to write to.
		let outputStream = this.outputStream;

		try {
			// Spawn the 'cat' command which will copy input on STDIN to STDOUT.
			const cat = spawn('cat');

			// Check for errors from 'cat'.
			cat.on('error', (e) => {
				this.error(`RuleExampleUsingCat: ` + e.message);
				inputStream.pipe(outputStream);	// Pipe the input to the output without running through 'cat'.
			});

			// Redirect the input stream into 'cat's STDIN. 
			inputStream.pipe(cat.stdin);
			
			// Redirect 'cat's STDOUT to the output stream.
			cat.stdout.pipe(outputStream);
		} catch (e) {
			this.error(`RuleExampleUsingCat: ` + (e.message ? e.message : e);
			inputStream.pipe(outputStream);
		}

		// Return the output stream to the validator indicating that a stream is being returned.
		return this.asStream(outputStream);
	}
}

module.exports = RuleExampleUsingCat;
```
