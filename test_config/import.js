const fs = require('fs');
const path = require("path");
const child_process = require('child_process');

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

            child_process.exec('python /opt/PLUTO/config/copy.py ' + sourceFileName + ' ' + targetFileName, (error, stdout, stderr) => {

                if (error) {
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                    reject("Failed to copy file.");
                    return;
                }

                resolve();
            });
        });
    }

};

module.exports = LocalCopyImport;
