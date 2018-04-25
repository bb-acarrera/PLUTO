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
					}
				]
			},
            {
                name: 'base',
                label: 'Source file base path',
                type: 'string',
                tooltip: 'The full path to a base folder where the file to process is located  (optional and pre-pended to the file)'
            },
			{
				name: 'type',
				label: 'Column Type',
				type: 'choice',
				choices: [
					{value:'string', label:'String'},
					{value:'float', label:'Float'},
					{value:'integer', label:'Integer'},
					{value:'iso_8061_datetime', label:'ISO 8601 Datetime'}
				],

				tooltip: 'The expected data type of the given column.'
			}
        ];
    }

}

module.exports = LocalCopyImport;
