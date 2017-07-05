const fs = require('fs-extra');
const path = require("path");
const spawn = require('child_process').spawn;

const LocalCopyImport = {

    importFile: function(targetFileName, config) {

        return new Promise((resolve, reject) => {

            if(!targetFileName) {
                reject('No target file name');
            }

            if(!config.file) {
                reject('No source file name');
            }

            const sourceFileName = path.resolve(config.file);

            if(!fs.existsSync(sourceFileName)) {
                reject(config.file + ' does not exist');
            }

            // Copy the file using internal JavaScript functions.
            fs.copySync(sourceFileName, targetFileName);
			resolve();

        });
    }

};

module.exports = LocalCopyImport;
