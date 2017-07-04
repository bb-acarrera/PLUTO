const fs = require('fs-extra');
const path = require("path");

const LocalCopyExport = {

    exportFile: function(fileName, config, runId, errorLog) {

        return new Promise((resolve, reject) => {

            if(!config.file) {
                reject('No source file name');
            }

            if(fileName) {
                const targetFileName = path.resolve(config.file);

                fs.copySync(fileName, targetFileName);
            }

            console.log(errorLog);

            resolve();

        });
    }

};

module.exports = LocalCopyExport;
