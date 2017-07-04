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

            /*
            // Copy the file using streams.
            const rd = fs.createReadStream(sourceFileName);
            rd.on('error', err => reject(err));
            const wr = fs.createWriteStream(targetFileName);
            wr.on('error', err => reject(err));
            wr.on('close', () => resolve());
            rd.pipe(wr);
            */

            // Copy the file using internal JavaScript functions.
            // fs.copySync(sourceFileName, targetFileName);
			// resolve();

            // Copy the file using an external process ('cp' in this case).
			const cat = spawn('cp', [sourceFileName, targetFileName]);
            cat.on('close', () => resolve());
            cat.on('error', () => reject("Failed to copy file."));
        });
    }

};

module.exports = LocalCopyImport;
