# Python Rules

Python rules are simply [Python](https://www.python.org) applications that are invoked by the validator
 to validate or modify data files. 

## 1.0. Overview

The validator uses Python 2.7. Python 3.0+ cannot be used.

The Python rule is invoked with the name of the input file and the expected name of the output file.

The validator does not detect rules which take an inordinate amount of time, or perhaps have fallen
into an infinite loop. It is entirely the responsibility of the plug-in to terminate in a reasonable
amount of time.

## 2.0. Command Line

When the validator invokes the Python rule it supplies two arguments on the command line. The first is
the path to the input file, the file that the rule must operate on. The second is the name of the generated
output file.
Whether or not the rule modifies the input file it must generate the output file, even if it is just a copy
of the input file.

## 3.0. STDOUT/STDERR

The validator looks at the STDOUT and STDERR streams of the Python rule and captures their output. Text output to
STDOUT is treated as warnings about the input file. Each line of the output is treated as a separate warning. Text
output to the STDERR stream is treated as errors in the input file. Again, each line is treated as a separate error.

Because the validator captures the content on these two streams Python plug-ins should not write general status
messages to STDOUT and instead should write their own log file if necessary.

## 4.0. Exit Value

If the Python Rule exits with a value other than 0 the value will be written to the common log as an error.
Rules should always precede a non-zero exit value with a message explaining the error to STDERR otherwise
anyone examining the log will not know why the rule generated the error status.

## 5.0. Ruleset Config

Internal to the validator the handling of Python rules is done through a dedicated JavaScript rule.
So the ruleset configuration for a Python rule is the same as any other rule, that is, the rule definition
 requires a `fileName` property and a `config` property. The `filename` property must be set to "RunPythonScript",
 the name of the JavaScript rule that runs Python rules. The `config` property should contain an object
 with a single `pythonScript` property which points to the Python script to run, either with an absolute
 path or one relative to the working directory of the validator application.
 
```json
{
    "fileName" : "RunPythonScript",
    "config" : {
        "pythonScript" : "../test_config/copy.py"
    }
}
```

## 6.0. Example

This trivial example (which would be in a file in `"../test_config/copy.py"` to match the above ruleset
config) simply outputs messages to STDOUT, STDERR, and then copies the input file to the output.

```python
import sys
from shutil import copyfile

print "This is a warning!"
print >> sys.stderr, "This is an error!"

# Make sure that the output file exists by copying it from the input file.
copyfile(sys.argv[1], sys.argv[2])
```