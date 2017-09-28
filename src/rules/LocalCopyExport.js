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

            if(sourceFileName) {
                const targetFileName = path.resolve(this.config.file);

                fs.copySync(sourceFileName, targetFileName);
				resolve(path.basename(targetFileName));
			}
        });
    }

    static get Type() {
        return "exporter";
    }

    static get ConfigProperties() {
        return [
            {
                name: 'file',
                label: 'Desitation file path',
                type: 'string',
                tooltip: 'The full path to where the processed file should be placed'
            }
        ];
    }

};

module.exports = LocalCopyExport;
