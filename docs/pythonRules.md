# Python Rules

Python rules are simply [Python](https://www.python.org) specialized applications that are invoked by the validator to validate or modify data files. They are an example of the external process rules that are described [here][externalProcessRules].

## 1.0. Overview

Currently the `PythonAPI.py` helper only supports Python 2.7. (All the files used to implement the Python 2.7 API are available so it would not be too difficult to create new versions that support Python 3.0+. See the external process rules document for instructions on how to do this.)

The validator does not detect rules which take an inordinate amount of time, or perhaps have fallen into an infinite loop. It is entirely the responsibility of the plug-in to terminate in a reasonable
amount of time. (This may change in the future.)

A Python rule requires a slightly different setup than a JavaScript rule, essentially the same things (a rule file and a description of the UI) but in a different manner.

There is an example Python rule called `src/rules/validateFilename.py` which can be used as a starting point for implementing a new Python rule.

## 2.0. The Rule File

Python rule files should be saved to the `customRules` directory. They may have any name but for clarity should be suffixed with `.py`.

Python 2.7 rules can derive from the `PythonAPI.py` base class. Unfortunately, finding this class cannot be down automatically by the validator so instead a Python rule requires a few lines of template code to locate the base class. The template code is:

```Python
from __future__ import print_function
import os.path
import imp
import sys

plutoAPI = os.environ.get('PLUTOAPI')
if not plutoAPI:
	print("PLUTOAPI enviroment variable must be set and point to the directory containing PythonAPI.py.", file=sys.stderr)
	sys.exit(1)

try:
	apiPath = os.path.join(plutoAPI, "PythonAPI.py")
	api = imp.load_source('PythonAPI', apiPath)
except IOError:
	print("Failed to load the PythonAPI from \"" + plutoAPI + "\".", file=sys.stderr)
	sys.exit(1)
```

This code retrieves the `PLUTOAPI` environment variable, which is set in the Dockerfile for the container, and then checks that it is set. (This environment variable points to the location of rules within the container.)

It then attempts to load the `PythonAPI.py` file from the directory specified by `PLUTOAPI`. If the load fails it prints an error message and exits with an error code.

Generally next in the rule file will be a class derived from the `PythonAPIRule` base class, for example:

```Python
class ValidateFilename(api.PythonAPIRule):
```

This class would include methods specified by the `PythonAPIRule` class (described below).

Finally the rule should conclude with the following:

```Python
api.process(ValidateFilename)
```

where `ValidateFilename` is the name of the class. This allows the validator to find the implementation of the rule.

## 3.0 Describing the UI

In a JavaScript rule the description of the rule's UI is done within the `.js` file. That is not possible for Python rules. Instead Python rules require a separate JSON file that describes the UI. This file must be named the same as the Python file but with the addition of a `.json` suffix. For example if the rule file is called `MyPythonRule.py` then the JSON file must be named `MyPythonRule.py.json`. This file must be in the same directory as the Python file.

The JSON file contains a JSON array of UI descriptors structured identically to the JavaScript UI descriptors (just in a JSON file rather than a JavaScript method). For example:
```json
[
	{
		"name": "regex",
		"label": "Regular Expression",
		"type": "string",
		"tooltip": "The regular expression to use to validate the filename.",
		"validations": [
			{
				"length": {
					"min": 1
				}
			}
		]
    },
	{
		"shortdescription": "Validate the name of the source file.",
		"longdescription": "This rule validates the name of the source file against a regular expression. An error is reported if the filename fails to match the regular expression.",
		"title": "Check Filename",
		"changeFileFormat": false
	}
]
```

More details on the properties are [here][ruleUiConfig].

## 4.0 The Manifest File

The `customRules` directory should contain a `manifest.json` file that the validator reads to learn what rules are available. Elsewhere there is a description of
how to include references to JavaScript rules. Python rules are similar. In the `rules` section of the `manifest.json` file there should be something similar to
the following for each Python rule:

```json
{
	"filename":"ValidateZipFilenames",
	"script" : "/opt/PLUTO/config/customRules/ValidateZipFilenames.py",
	"executable" : "python"
}
```

`filename` is a useful, brief description of the rule, generally the root name of the Python file, `script` should be the absolute path to the Python file within the Docker container, and `executable` should be `python` (or whatever the name of the Python 2.7 executable is called in the Docker container, which really should always just be `python`). As described elsewhere it's possible to have other types of external process rules than just Python, hence the need for the `executable` key/value pair. This executable should be in the execution path of the validator (which is true for `python` in the supplied Docker container).

## 5.0 The Implementation

A Python rule class must implement two methods, a constructor and a `run()` method.

### 5.1 Constructor

The constructor should do any initialization required by the rule and at a minimum should have the following:

```python
def __init__(self, config):
	super(ValidateFilename, self).__init__(config)
```

where `ValidateFilename` is replaced by the class name. The `config` object contains the same configuration information that a JavaScript rule would receive and is described [here][ruleConfig].

### 5.2 Run()

The only other method a Python rule must implement is a `run()` method that does the actual work of the rule. The signature of the `run()` method must be:

```python
def run(self, inputFile, outputFile, encoding):
```

where `self` is the instance of the class, standard to Python 2.7 classes, `inputFile` is the fully qualified path to the input file, `outputFile` is the fully qualified name of the expected output file (it will not exist and must be created by the rule), and a string representing the text encoding of the `inputFile` which generally would be 'utf8'. The method should not return anything.

The rule is expected to read the input file and write to the output file even if the rule is filtering something other than the contents of the file, for example, the name of the file. If the rule does not need to modify the contents of the file it can call the following API method to efficiently copy the input to the output:

```python
api.PythonAPIRule.run(self, inputFile, outputFile, encoding)
```

### 5.3 Reporting Results

Python rules should not write anything to `stdout` nor `stderr`. These streams are used by the base class to report errors to the validator. Instead Python rules should use one any of the reporting methods provided by the base class. These methods are `warning()`, and `error()`.

#### 5.3.1 warning()

The `warning()` method is used to report non-critical issues with the data. Warnings will not cause the validator to abandon processing of the input file. `warning()` is called as:

```python
self.warning(msg)
```

where `msg` is a text string. Through the client UI it is possible to configure the maximum number of warnings a rule can report.

#### 5.3.2 error()

The `error()` method is used to report critical issues with the data. A rule can report as many errors as necessary. When any are reported the validator will cease processing the input file after this rule completes. Like the `warning()` method the `error()` method is invoked as:

```python
self.error(msg)
```

### 5.4 Example

Here is the `ValidateFilename` class which demonstrates how to write a rule that validates the input file name and does not modify the actual file.

```python
class ValidateFilename(api.PythonAPIRule):
	def __init__(self, config):
		super(ValidateFilename, self).__init__(config)
	
	def run(self, inputFile, outputFile, encoding):
		# NOTE: dot syntax doesn't work for dereferencing fields on self.config because the properties are defined using UTF-8 strings. 
		if not "regex" in self.config:
			self.error("No regex specified.")
		elif not "importConfig" in self.config:
			self.error("No importConfig specified in the rule config.")
		elif not "file" in self.config["importConfig"]:
			self.error("No file specified in the rule config.importConfig.")
		else:
			filename = os.path.basename(self.config["importConfig"]["file"])
			prog = re.compile(self.config["regex"], re.UNICODE)
			if prog.match(filename) is None:
				self.error(filename + " does not match the regular expression " + self.config["regex"])
		
		# Copy the file.	
		api.PythonAPIRule.run(self, inputFile, outputFile, encoding)
```

[externalProcessRules]: externalProcessRules.md
[ruleConfig]: ruleConfig.md
[ruleUiConfig]: ruleUiConfig.md
