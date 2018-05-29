const RuleAPI = require("../../api/RuleAPI");

const fs = require("fs");
const fse = require('fs-extra');
const path = require("path");

var AdmZip = require('adm-zip');

/*
unzips a file or set of files
 - if one file in the zip, unzips that file to the specified output file name
 - if more that one file, unzips to a folder specified as the output file name
 - if it's not a zip file, just copies the file to the output file name

Intended to be used as input for other rules, so should only be a single item to be validated.
e.g. a single csv, or the components of a shapefile (one .shp, .dbf, .prj, .shx, etc.)

 */

class unZipSingleFile extends RuleAPI {
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

	_unzipFile(inputFile, outputFile) {

		if(!fs.existsSync(inputFile)) {
			this.error(`${inputFile} does not exist.`);
			return outputFile;
		}

		let zip = null;

		try {
			zip = new AdmZip(inputFile);
		} catch(e) {
			//not a file, so just copy and return
			fse.copySync(inputFile, outputFile, { overwrite: true });
			return outputFile;
		}

		var zipEntries = zip.getEntries();

		if(zipEntries.length > 1) {
			fs.mkdirSync(outputFile);
			zip.extractAllTo(outputFile, true);
			this.unzipSingleSharedData.wasUnzipped = true;
		} else if(zipEntries.length === 1) {
			// zip.extractEntryTo(zipEntries[0].entryName, outputFile, true, true); Doesn't work!!!
			zip.extractAllTo(outputFile, true);
			this.unzipSingleSharedData.wasUnzipped = true;
			outputFile = path.resolve(outputFile, zipEntries[0].entryName);
		} else {
			this.error(`Zip file is empty`);
			fse.copySync(inputFile, outputFile, { overwrite: true });
		}

		return outputFile;
	}

	run() {
		return new Promise((resolve, reject) => {

			let outputFile = this.outputFile;

			let inputName = this.inputFile;
			if (inputName instanceof Promise) {
				inputName.then((filename) => {
					outputFile = this._unzipFile(filename, outputFile);
					resolve(this.asFile(outputFile));
				}, (error) => {
					reject(error);
				});
			}
			else {
				outputFile = this._unzipFile(inputName, outputFile);
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
module.exports = unZipSingleFile;