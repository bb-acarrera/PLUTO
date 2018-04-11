const RuleAPI = require("../../api/RuleAPI");

const fs = require("fs");
const fse = require('fs-extra');
const path = require("path");

var AdmZip = require('adm-zip');

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

		if(!fs.existsSync(inputFile)) {
			this.error(`${inputFile} does not exist.`);
			return outputFile;
		}

		if(!this.unzipSingleSharedData.wasUnzipped) {
			//don't zip it back up
			fse.copySync(inputFile, outputFile, { overwrite: true });
			return;
		}

		let filestat = fs.lstatSync(inputFile);



		if(filestat.isFile()) {

			let zip = new AdmZip();

			zip.addLocalFile(inputFile);
			zip.writeZip(outputFile);

		} else if(filestat.isDirectory()) {

			let zip = new AdmZip();

			fs.readdirSync(inputFile).forEach((file) => {
				zip.addLocalFile(path.resolve(inputFile, file));
			});

			zip.writeZip(outputFile);

		} else {
			this.error(`Input is not a file or directory`);
			fse.copySync(inputFile, outputFile, { overwrite: true });
		}

	}

	run() {
		return new Promise((resolve, reject) => {

			let outputFile = this.outputFile;

			let inputName = this.inputFile;
			if (inputName instanceof Promise) {
				inputName.then((filename) => {
					this._rezipFile(filename, outputFile);
					resolve(this.asFile(outputFile));
				}, (error) => {
					reject(error);
				});
			}
			else {
				this._rezipFile(inputName, outputFile);
				resolve(this.asFile(outputFile));
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