const DataAPI = require("../api/DataAPI");
const path = require('path');
const fs = require('fs-extra');

/**
 * This Data class loads and saves files to a local directory.
 */
class DefaultData extends DataAPI {
	constructor(localConfig) {
		super(localConfig);

		this.inputDirectory  = path.resolve(localConfig.RootDirectory, localConfig.InputDirectory);
		this.outputDirectory = path.resolve(localConfig.RootDirectory, localConfig.OutputDirectory);
		this.logDirectory = path.resolve(localConfig.RootDirectory, localConfig.LogDirectory);
	}

	/**
	 * This example implementation of the DataAPI loadFile() method loads a file from a directory on the local
	 * file system and returns the results in a single object.
	 * @param filename the name of the file to load. The global RootDirectory is used to resolve the filename
	 * if it is not an absolute path.
	 * @param the character encoding for the file. The default is 'utf8'.
	 * @returns an object (generally a string) containing the loaded file.
	 * @throws throws an error if the given file cannot be found or read.
	 */
	loadFile(filename, encoding) {
		return fs.readFileSync(path.resolve(this.inputDirectory, filename), encoding || 'utf8');
	}

	/**
	 * This method is used by the application to save the log of results for the given file synchronously. Derived classes should implement
	 * everything to save the file appropriately, ideally as a JSON file. An error should be thrown if the file cannot be saved.
	 * @param logContents the contents of the file.
	 * @param filename the name data file the log file is based on.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 */
	saveLog(logContents, filename) {
		try {
			if (!fs.existsSync(this.logDirectory))
				fs.mkdirSync(this.logDirectory);	// Make sure the logDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.logDirectory + "\".\n" + e);	// Can't create the logDirectory to write to.
			throw e;
		}

		const basename = path.basename(filename, path.extname(filename));
		fs.writeFileSync(path.resolve(this.logDirectory, basename + ".log.json"), JSON.stringify(logContents), 'utf8');
	}

	/**
	 * This example implementation of the DataAPI saveFile() method saves a file to a directory on the local
	 * file system.
	 * @param fileContents the contents of the file.
	 * @param filename the name of the file to save. The global RootDirectory is used to resolve the filename
	 * if it is not an absolute path.
	 * @param the character encoding for the file. The default is 'utf8'.
	 * @throws throws an error if the output directory does not exist and cannot be created or if the file cannot be saved.
	 */
	saveFile(fileContents, filename, encoding) {
		try {
			if (!fs.existsSync(this.outputDirectory))
				fs.mkdirSync(this.outputDirectory);	// Make sure the inputDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\".\n" + e);	// Can't create the outputDirectory to write to.
			throw e;
		}

		fs.writeFileSync(path.resolve(this.outputDirectory, filename), fileContents, encoding || 'utf8');
	}

	/**
	 * This method is used by the application to copy a local file (generally the final result of running a ruleset)
	 * to a remote destination managed by the plugin.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the remote location.
	 * @param fileNameOrStream the absolute name of the local file to copy or a Readable stream to read the data from.
	 * @param remoteFileName the name of the remote copy of the file.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 */
	putFile(fileNameOrStream, remoteFileName) {
		try {
			if (!fs.existsSync(this.outputDirectory))
				fs.mkdirSync(this.outputDirectory);	// Make sure the inputDirectory exists.
		}
		catch (e) {
			console.error(this.constructor.name + " failed to create \"" + this.outputDirectory + "\".\n" + e);	// Can't create the inputDirectory to write to, so can't use this logger.
			throw e;
		}

		if (typeof fileNameOrStream === 'string') {
			fs.copySync(fileNameOrStream, path.resolve(this.outputDirectory, remoteFileName));
		}
		else {
			const dst = fs.createWriteStream(path.resolve(this.outputDirectory, remoteFileName));
			fileNameOrStream.pipe(dst);
		}
	}

	/**
	 * This method is used by the application to get an in-memory copy of a log file managed by
	 * the plugin.
	 * @param logFileName the name of the log file to retrieve.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 */
	getLog(logFileName) {
		return require(path.resolve(this.logDirectory, logFileName));
	}

	/**
	 * This method is used by the application to copy a remote file (generally the input to a ruleset) managed by
	 * the plugin to a local destination managed by this application.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the local location.
	 * @param remoteFileName the name of the remote copy of the file.
	 * @param localFileName the absolute name of the local file to copy.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 */
	getFile(remoteFileName, localFileName) {
		fs.copySync(path.resolve(this.inputDirectory, remoteFileName), localFileName);
	}
}

module.exports = DefaultData;
module.exports.instance = DefaultData;	// Necessary to allow the application to instantiate this class.
