const fs = require('fs-extra');
const path = require("path");

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
            const rd = fs.createReadStream(sourceFileName);
            rd.on('error', err => reject(err));
            const wr = fs.createWriteStream(targetFileName);
            wr.on('error', err => reject(err));
            wr.on('close', () => resolve());
            rd.pipe(wr);
            */

            fs.copySync(sourceFileName, targetFileName);
            resolve();

        });
    }

};

module.exports = LocalCopyImport;
