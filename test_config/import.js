const fs = require('fs');
const path = require("path");
const child_process = require('child_process');

class LocalCopyImport {
	constructor(config) {
		this.config = config;
	}

    importFile(targetFileName) {

        return new Promise((resolve, reject) => {
            // Check that a targetFileName was specified. The target will be on the local file system.
            if(!targetFileName) {
                reject('No target file name');
            }

            // Check that the importer's config has a "file" attribute.
            if(!this.config.file) {
                reject('No source file name');
            }

            const sourceFileName = path.resolve(this.config.file);

            if(!fs.existsSync(sourceFileName)) {
                reject(this.config.file + ' does not exist');
            }

            // Launch a child process, python in this case, which uses a python script called copy.py which
            // simply copies the source file to the target.
            child_process.exec('python /opt/PLUTO/config/copy.py ' + sourceFileName + ' ' + targetFileName, (error, stdout, stderr) => {

                if (error) {
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                    reject("Failed to copy file.");
                    return;
                }

                // Tell the Promise that it has been properly resolved.
                resolve(path.basename(sourceFileName));
            });
        });
    }

    static get Type() {
        return "importer";
    }

    static get ConfigProperties() {
        return [
            {
                name: 'file',
                label: 'Source file path',
                type: 'string',
                tooltip: 'The full path to where the file to process is located'
            }
        ];
    }

};

// Export the class.
module.exports = LocalCopyImport;
