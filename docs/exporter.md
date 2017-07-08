# Custom Exporters

As well as custom importers a validator ruleset will often require that the generated output file and
log file be saved to a location other than the local file system.
 To save to such locations a custom exporter is required.
 
A custom exporter is a simple `JavaScript` plug-in to the validator that encapsulates the logic for
 placing a file on the local file system in an alternative location such as into a database or to
  a service such as S3.

## 1.0. Overview

A custom exporter is a `JavaScript` (ES6+) class that is dynamically loaded by the validator and is used to
export a file from the local file system. The class must have two publicly visible methods, a constructor
and a method named `exportFile` which takes a file name as input.

## 2.0. Methods

The exporter class can have any number of methods to implement it's required functionality but at a minimum
 requires a constructor and an `exportFile` method.
 
### 2.1. constructor(config)

The constructor must exist and is called with a single argument, the configuration object for the exporter
as defined in the parent [ruleset] and possibly modified by a ruleset [override](ruleset#3.0.-Overrides).
The constructor should save this config object for use by the `importFile` method.

The `config` object should include any information necessary to successfully export a file from the local 
file system. This information should include the remote filename and may also include URLs,
credentials, etc. (The `config` exists in a readable file, the ruleset file, so if private credentials
are required it is the responsibility of the author of the exporter to obfuscate credentials if necessary
to maintain privacy.)

### 2.2. exportFile(sourceFileName)

`exportFile()` takes a three arguments, the fully qualified name of the local file system file that
the exporter should export, the ID of the run - a unique string identifying the current run of the
ruleset - and the run's error log in a JavaScript object. The remote, destination file should be defined by the
`config` object passed to the constructor.

The `exportFile()` method may write the error log in any manner it chooses. For example the `errorLog`
could be passed to [JSON.stringify()](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
to convert it to a string that can then be written to a file.

It should return a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
which exports the file calling `resolve()` when the file has been successfully written to the remote
location and `reject()`, with a description, when an error occurs.
 
## 3.0. Example

This simple example of a custom exporter copies a file, defined in `config` to the remote location.

```javascript
const fs = require('fs-extra');
const path = require("path");

class LocalCopyExport {
	constructor(config) {
		this.config = config;
	}

	exportFile(sourceFileName, runId, errorLog) {
        return new Promise((resolve, reject) => {
            if(!this.config.file) {
                reject('No target file name.');
                return;
            }

            if(fileName) {
                const targetFileName = path.resolve(this.config.file);

                fs.copySync(sourceFileName, targetFileName);
				resolve();
			}
        });
    }
}

module.exports = LocalCopyExport;
```

[ruleset]: ruleset.md
