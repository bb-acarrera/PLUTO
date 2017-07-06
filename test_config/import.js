const fs = require('fs');
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


            // Copy the file using an external process ('cp' in this case).
			const proc = spawn('cp', [sourceFileName, targetFileName]);
            proc.on('close', () => resolve());
            proc.on('error', () => reject("Failed to copy file."));
        });
    }

};

module.exports = LocalCopyImport;
