# Custom Importers

Often a validator ruleset will require input data files from a location other than the local file system.
 To retrieve such files a custom importer is required.
 
A custom importer is a simple `JavaScript` plug-in to the validator that encapsulates the logic for
 taking a file from a resource and making it available to the validator on the local file system.

## 1.0. Overview

A custom importer is a `JavaScript` (ES6+) class that is dynamically loaded by the validator and is used to
import a file to the local file system. The class must have two publicly visible methods, a constructor
and a method named `importFile` which takes a file name as input.

## 2.0. Methods

The importer class can have any number of methods to implement it's required functionality but at a minimum
 requires a constructor and an `importFile` method.
 
### 2.1. constructor(config)

The constructor must exist and is called with a single argument, the configuration object for the importer
as defined in the parent [ruleset] and possibly modified by a ruleset [override](ruleset#3.0.-Overrides).
The constructor should save this config object for use by the `importFile` method.

The `config` object should include any information necessary to successfully import a file and write it
to the local file system. This information should include the filename and may also include URLs,
credentials, etc. (The `config` exists in a readable file, the ruleset file, so if private credentials
are required it is the responsibility of the author of the importer to obfuscate credentials if necessary
to maintain privacy.)

Similarly to rules the `config` object for the importer is updated with some useful properties. See
[this document](ruleConfig.md) for more information.
 
### 2.2. importFile(targetFileName)

This method performs the actual import of the file and is called by the validator before the first rule is
executed.

`importFile()` takes a single argument, the fully qualified name of the local file system file that
the importer should write the imported file into. The remote, source file should be defined by the
`config` object passed to the constructor.

It should return a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
which imports the file calling `resolve()` when the file has been successfully written to the `targetFileName`
and `reject()`, with a description, when an error occurs.

If the rule should set the `encoding` property on the `config` object to the encoding
of the file. By default it will be 'utf8'. This allows the rules to properly handle
the file.

## 3.0. Example

This simple example of a custom importer copies a file, defined in `config` to the target location.

```javascript
const fs = require('fs-extra');
const path = require("path");

class LocalCopyImport {
	constructor(config) {
		this.config = config;
	}

	importFile(targetFileName) {

        return new Promise((resolve, reject) => {

            if(!targetFileName) {
                reject('No target file name');
            }

            if(!this.config.file) {
                reject('No source file name');
            }

            const sourceFileName = path.resolve(this.config.file);

            if(!fs.existsSync(sourceFileName)) {
                reject(this.config.file + ' does not exist');
            }

            // Copy the file using internal JavaScript functions.
            fs.copySync(sourceFileName, targetFileName);
			resolve();

        });
    }

}

module.exports = LocalCopyImport;
```

[ruleset]: ruleset.md
