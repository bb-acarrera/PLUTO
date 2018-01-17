# External Process Rules

External process rules, that is, are rules that run outside of the validator's JavaScript process. The Python rules, described elsewhere, are a type of external process rule where we have already provided a base class that hides much of the interfacing between the validator and the external process.

## 1.0. Overview

External process rules can be written in any language, however it is necessary to ensure that the interpreter for the language, if required, or the executable, exists within the Docker container.

This mechanism can be used to implement rules that require Python 3.0+.

## 2.0. The Rule File

External process rule files should be saved to the `customRules` directory. They will be invoked with specific command line arguments to allow them to process the input file. This is described below.

## 3.0 Describing the UI

For an external process rule the description of the rule's UI is done within a separate JSON file. This file must be named the same as the rule file but with the addition of a `.json` suffix. For example if
the rule file is called `MyPythonRule.py` then the JSON file must be named `MyPythonRule.py.json`. This file must be in the same directory as the rule file. If there is only an executable and no script then use the executable name.

The JSON file contains a JSON array of UI descriptors structured identically to the JavaScript UI descriptors (just in a JSON file rather than a JavaScript method).
For example:
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
		"title": "Check Filename"
	}
]
```
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

`filename` is a useful, brief description of the rule, generally the root name of the rule file, `script` should be the absolute path to the interpreted rule file within the Docker container, and `executable` should be the application that is used to run the script. For example if the rule is a python rule the executable should be `python` (or whatever the name of the Python 2.7 executable is called in the Docker container, which really should always just be `python`).

If the rule is implemented in a compiled language such as C or C++ where there is no script then just the `executable` needs to be specified and the `script` should be omitted.

## 5.0 The Implementation

An external process rule must implement several pieces of code to properly communicate with the validator. These include command line argument parsing, retrieving configuration data from a socket and a file, and writing JSON status messages to the `stderr` stream. At present the validator does not make use of the `stdout` stream but use is reserved for the future.

Rules must write the input file to the output file. Some rules may simply validate configuration data, for example the filename, but they must still write the input file to the output. Similarly if a rule is validating the data and not modifying it still must do this copy. And if a rule modifies the input file, for example deleting a column, it must write the modified data to the output file. Failure to write anything would cause any following rules to fail for an absence of data.
### 5.1 Command Line Processing

The validator invokes external processes by spawning them and passing most information on the command line. This fragment of Python code demonstrates everything that an external process rule should do.

```python
parser = argparse.ArgumentParser(description='Run a Python rule.')
parser.add_argument('-i', dest='inputName',
					help="The name of the input file to read.", required='True')
parser.add_argument('-o', dest='outputName',
					help="The name of the output file to write.", required='True')
parser.add_argument('-e', dest='encoding',
					help="The file encoding of the input file. The output file will be written with the same encoding.", default='utf8')
group = parser.add_mutually_exclusive_group(required=True)
group.add_argument('-s', dest='socketAddr',
					help="The name of the socket file to read the configuration information from.")
group.add_argument('-c', dest='configName',
					help="The name of a file to read the configuration information from.")

try:
	args = parser.parse_args()
except Exception as e:
	print(str(e))

if pythonRuleClass is None:
	print("No python class specified.", file=sys.stderr)
	return

if not args:
	print("No arguments specified.", file=sys.stderr)
	return

inputName = args.inputName
outputName = args.outputName
encoding = args.encoding
socketAddr = args.socketAddr
configName = args.configName
```

This should be self-explanatory even without knowledge of Python, but in a nutshell the validator will call the external process rule with four arguements. `-i` is followed by the absolute path to the file the rule should read. `-o` is followed by the name of the file the rule should write. The file will not exist. `-e` specifies the encoding of the input file and if omitted the rule should default to 'utf8'. Finally the rule can be called with either a `-s` or `-c` argument indicating how to read the configuration information. `-s` is used to send the information via a socket and is followed by the socket address. `-c` is used when the configuration information is sent via a file and is followed by the fully qualified path to the configuration file. (The contents of the configuration data is described below.)

Rules should process the command line arguments and if any errors are encountered (for example the input file cannot be read) then these errors should be reported to the `stderr` stream.

### 5.2 Reading Configuration Data From a File

The configuration data is specified as JSON data, generally a map of key/value pairs. Below is an example of the Python code that loads the configure information for the Python rules. All it does is reads the file and runs it through a JSON library that converts the file's text into Python objects.

```python
def loadConfigFromFile(filename):
	try:
		f = open(filename, 'r')
		return json.loads(f.read())
	except Exception as err:
		print("Failed to read from " + filename, file=sys.stderr)
		print(err, file=sys.stderr)
		sys.exit(1)		# Inelegant but effective.

	return None  # Should never get here.
```

### 5.2 Reading Configuration Data From a Socket

This is much like reading the configuration data from a file but a socket is used instead. There is no indication whether the validator will use files or sockets for configuration information so an external process rule must implement both mechanisms.

```python
def loadConfigFromSocket(socketAddr):
	# Create a UDS socket to receive the chunks info.
	sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

	chunks = ''
	try:
		sock.connect(socketAddr)
		while True:
			chunk = sock.recv(1024)
			if chunk == b'':
				break
			chunks += chunk.decode('utf-8')

	except socket.error as err:
		print("Failed to read from " + socketAddr, file=sys.stderr)
		print(err, file=sys.stderr)
		sys.exit(1)		# Inelegant but effective.

	return json.loads(chunks)
```

This code simply reads the contents of the socket a chunk at a time building up a single large string and then sends this string to the JSON library for converting to Python objects. (In the PythonRuleAPI class the read configuration object is then passed to the constructor of the Python rule.)

### 5.3 Writing Status Messages

An external process rule must write any error messages to the `stderr` stream using a particular JSON structure so that the validator can properly interpret the messages for display to the user. Below is the Python code that does this as an example.

```python
	def log(self, level, problemFileName, ruleID, problemDescription):
		level = "UNDEFINED" if level is None else level
		problemFileName = "" if problemFileName is None else problemFileName
		problemDescription = "" if problemDescription is None else problemDescription

		response = {
			"type": level,
			"problemFile": problemFileName,
			"ruleID": ruleID,
			"description": problemDescription
		}
		jsonStr = json.dumps(response)
		jsonStr = jsonStr.replace("\n", " ")
		print(jsonStr, file=sys.stderr)
		
	def error(self, problemDescription):
		self.log("Error", self.__class__.__name__, self.config["id"], problemDescription)

	def warning(self, problemDescription):
		self.log("Warning", self.__class__.__name__, self.config["id"], problemDescription)
```

The most important method is the `log()` method which does the actual output to `stderr`. The `error()` and `warning()` methods are simply convenience wrappers around the `log()` method that simplify error reporting.

`log()` has five parameters. The first, `self` is standard for Python classes and can be ignored in other languages. The second, `level`, should be either *Error* or *Warning*. Anything else will be ignored by the validator and therefore not shown to the user. Errors cause the validator to abort processing at the completion of the current rule while warnings are reported and do not stop processing. `problemFile` should be the name of the rule. `ruleID` should be the *id* value specified in the config. data. And finally `problemDescription` should be a message to the user that succinctly describes the problem the rule discovered in the input file.


