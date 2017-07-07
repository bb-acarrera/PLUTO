const fs = require('fs-extra');
const path = require("path");

class LocalCopyExport {
	constructor(config) {
		this.config = config;
	}

	exportFile(fileName, runId, errorLog) {

        return new Promise((resolve, reject) => {

            if(!this.config.file) {
                reject('No source file name');
                return;
            }

            if(fileName) {
                const targetFileName = path.resolve(this.config.file);

                fs.copySync(fileName, targetFileName);
				resolve();
			}
        });
    }

};

module.exports = LocalCopyExport;
