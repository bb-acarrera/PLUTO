const RuleAPI = require("../../api/RuleAPI");

const fs = require("fs");
const fse = require('fs-extra');
const path = require("path");

//var AdmZip = require('adm-zip');
var archiver = require('archiver');

/*
 rezips a file unzipped by unzipSingle

 */

class reZipSingleFile extends RuleAPI {
	constructor(config) {
		super(config);

		if(this.config.__state && this.config.__state.sharedData) {
			if (!this.config.__state.sharedData.unzipSingle) {
				this.config.__state.sharedData.unzipSingle = {};
			}

			this.unzipSingleSharedData = this.config.__state.sharedData.unzipSingle;
		} else {
			this.unzipSingleSharedData = {};
		}
	}

	_rezipFile(inputFile, outputFile) {

		return new Promise((resolve, reject) => {
			if(!fs.existsSync(inputFile)) {
				this.error(`${inputFile} does not exist.`);
				reject(`${inputFile} does not exist.`);
				return;
			}

			let filestat = fs.lstatSync(inputFile);

			if(!this.unzipSingleSharedData.wasUnzipped || (!filestat.isFile() && !filestat.isDirectory())) {
				//don't zip it back up

				if(!filestat.isFile() && !filestat.isDirectory()) {
					this.error(`Input is not a file or directory`);
				}

				fse.copySync(inputFile, outputFile, { overwrite: true });
				resolve();
				return;
			}

			let output = fs.createWriteStream(outputFile);
			let archive = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});

			// listen for all archive data to be written
			// 'close' event is fired only when a file descriptor is involved
			output.on('close', function() {
				resolve();
			});

			archive.on('error', function(err) {
				this.error(err.toString());
				reject(err.toString());
			});

			archive.pipe(output);

			if(filestat.isFile()) {

				archive.file(inputFile, { name: path.basename(inputFile) });

			} else if(filestat.isDirectory()) {

				archive.directory(inputFile, false);
			}

			archive.finalize();
		});



	}

	run() {
		return new Promise((resolve, reject) => {

			let outputFile = this.outputFile;

			let inputName = this.inputFile;
			if (inputName instanceof Promise) {
				inputName.then((filename) => {
					this._rezipFile(filename, outputFile).then(() => {
						resolve(this.asFile(outputFile));
					}, (error) => {
						reject(error);
					});

				}, (error) => {
					reject(error);
				});
			}
			else {
				this._rezipFile(inputName, outputFile).then(() => {
					resolve(this.asFile(outputFile));
				}, (error) => {
					reject(error);
				});
			}


		});
	}

	get structureChange() {
		return true;
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = reZipSingleFile;