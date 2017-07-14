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

## 5. `use*()` methods

To operate on the input file the rule implementation should include one or more of the following methods. The methods
take the input from and return the results to different entities. This allows rules to use different approaches to
examining the data. For example a rule could expect data to come and go via files on the local file system, while
another may expect the data to be entirely in memory.

Rules may implement any number of these methods. Doing so allows a rule to retrieve data from the previous rule in
whatever form the previous rule produced it. This avoids having to convert the data from one form to another.

### 5.1 this.emit(RuleAPI.NEXT, ...)

Rules can run somewhat asynchronously so returning from one of these methods is not necessarily sufficient to know
that the rule has completed. Instead when a rule completes its work it needs to send a message indicating that it is
done. This is accomplished through emitting the `RuleAPI.NEXT` at completion.

`this.emit()` takes two arguments. The first will always be `RuleAPI.NEXT` and the second will be the return value of the
function.

#### 5.1.1 Example

```javascript
setImmediate(() => {
    this.emit(RuleAPI.NEXT, data);
});
```

### 5.2 `useMethod(data)`

If a rule implements this method it expects the entire data file to have been read into memory. For small data sets
this can be the most efficient way for a rule to access the data. The `data` argument to the rule contains this data
in an undefined form.

#### 5.2.1 Example
```javascript
const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingMethod extends RuleAPI {
	constructor(config) {
		super(config)
	}

	useMethod(data) {
		// ... Do something with the data.
		
		// When done, tell the validator to kick off the next rule.
		setImmediate(() => {
			this.emit(RuleAPI.NEXT, data);
		});
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingMethod;
```

### 5.3 `useFiles(filename)`

This method assumes the data to be validated exists in the named file on the local file system. The rule must open
the file, read and process the contents, either line by line or all at once, and then write it to a new file. The
method then emits the name of the generated file.

One of the properties in the configuration object passed to the rule's constructor is `tempDirectory`. The generated
file should be placed here to ensure it is deleted when the run of the ruleset is complete.

### 5.4 `useStreams(inputStream, outputStream)`

The `useStreams` method might be the most efficient method for rules that do not need to see the entire file all
at once. The data is not read into memory nor is it copied on the local file system.

The method takes two JavaScript [streams](https://nodejs.org/api/stream.html). The rule will read the data from the
input stream and write the resulting data to the output stream.

## 6. Example

This example demonstrates a rule which uses the `useStreams()` method and then shares those streams with an external
process (`cat` in this case).

Note that since it uses streams it emits the `RuleAPI.NEXT` message as soon as it starts reading data from the input
stream. This allows the following rule to start listening on the output stream for data so it will be ready as soon
as data is available.

This example can easily be modified to allow a rule to call any sort of external process.

```javascript
const spawn = require('child_process').spawn;
const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingCat extends RuleAPI {
	constructor(config) {
		super(config)
	}

	useStreams(inputStream, outputStream) {
		// Simply pipe the contents of the input stream to the output stream through the "cat" command.

		try {
			const cat = spawn('cat');

			cat.on('error', (e) => {
				// Encountered an error so report it.
				this.error(`RuleExampleUsingCat: ` + e);
				
				// Pipe the input to the output without running through 'cat'.
				inputStream.pipe(outputStream);
			});

			// Attach the input stream to cat's stdin.
			inputStream.pipe(cat.stdin);
			
			// Attach cat's stdout to the output stream.
			cat.stdout.pipe(outputStream);
		} catch (e) {
			this.error(`RuleExampleUsingCat: ` + e);
			inputStream.pipe(outputStream);
		}

		inputStream.once('readable', () => {
			// This is done as soon as there is data (i.e. as soon as the input stream is 'readable')
			// rather than at the end. Otherwise the buffers would fill and overflow without any way to drain them.
			this.emit(RuleAPI.NEXT, outputStream);
		});
	}
}

module.exports = RuleExampleUsingCat;
```