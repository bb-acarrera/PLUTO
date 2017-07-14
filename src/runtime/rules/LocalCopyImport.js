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
