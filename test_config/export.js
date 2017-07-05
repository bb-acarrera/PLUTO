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

                // Copy using a spawned process.
				const proc = spawn('cp', [fileName, targetFileName]);
                proc.on('close', () => {
					console.log(errorLog);
				    resolve()
				});
                proc.on('error', () => {
				    reject("Failed to copy file.")
				});
			}


        });
    }

};

module.exports = LocalCopyExport;
