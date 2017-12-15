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

            let sourceFileName;

            if(this.config.base) {
                sourceFileName = path.resolve(this.config.base, this.config.file);
            } else {
                sourceFileName = path.resolve(this.config.file);
            }

            if(!fs.existsSync(sourceFileName)) {
                reject(this.config.file + ' does not exist');
            }

            // Copy the file using internal JavaScript functions.
            fs.copySync(sourceFileName, targetFileName);
			resolve(path.basename(sourceFileName));

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
                tooltip: 'The full path (or partial path with a base) to where the file to process is located',
				validations: [
					{
						presence: true
					},
					{
						format: {
							regex: "^\\S",
							message: "{description} may not begin with whitespace"
						}
					},
					{
						format : {
							regex: "^(.*\\/)?\\w{1,35}\\.(csv|geojson|zip)$",
							message: "{description} must contain only [a-zA-Z0-9_] (at most 35) and end with .csv, .geojson, or .zip"
						}
					}
				]
			},
            {
                name: 'base',
                label: 'Source file base path',
                type: 'string',
                tooltip: 'The full path to a base folder where the file to process is located  (optional and pre-pended to the file)'
            }
        ];
    }

}

module.exports = LocalCopyImport;
