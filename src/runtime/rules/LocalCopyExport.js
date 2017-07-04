const fs = require('fs-extra');
const path = require("path");
const spawn = require('child_process').spawn;

const LocalCopyExport = {

    exportFile: function(fileName, config, runId, errorLog) {

        return new Promise((resolve, reject) => {

            if(!config.file) {
                reject('No source file name');
            }

            if(fileName) {
                const targetFileName = path.resolve(config.file);

                // fs.copySync(fileName, targetFileName);
				// resolve();

                // Copy using a spawned process.
				const cat = spawn('cp', [fileName, targetFileName]);
				cat.on('close', () => {
					console.log(errorLog);
				    resolve()
				});
				cat.on('error', () => {
				    reject("Failed to copy file.")
				});
			}


        });
    }

};

module.exports = LocalCopyExport;
