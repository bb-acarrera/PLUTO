/**
 *  This base class describes an API derived classes implement to load and save data files. Implementing classes
 *  can save files locally, in a database, through a REST API, etc.
 */
class DataAPI {
	constructor(localConfig) {}

	/**
	 * This method is used by the application to load the given file synchronously. Derived classes should implement
	 * everything to load the file into local storage. An error should be thrown if the file cannot be loaded.
	 * @param filename {string} the name of the file to load.
	 * @param encoding {string} the character encoding for the file. The default is 'utf8'.
	 * @returns {object|string} Returns an object (generally a string) containing the loaded file.
	 * @throws Throws an error if the file cannot be found or loaded.
	 * @abstract
	 */
	loadFile(filename, encoding) {
		throw(this.constructor.name + " does not load files.");
	}

	/**
	 * This method is used by the application to save the log of results for the given file synchronously. Derived classes should implement
	 * everything to save the file appropriately, ideally as a JSON file. An error should be thrown if the file cannot be saved.
	 * @param logContents {string} the contents of the file.
	 * @param filename {string} the name of the file to save.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 * @abstract
	 */
	saveLog(logContents, filename) {
		throw(this.constructor.name + " does not save log files.");
	}

	/**
	 * This method is used by the application to save the given file synchronously. Derived classes should implement
	 * everything to save the file appropriately. An error should be thrown if the file cannot be saved.
	 * @param fileContents {object} the contents of the file.
	 * @param filename {string} the name of the file to save.
	 * @param encoding {string} the character encoding for the file. The default is 'utf8'.
	 * @throws Throws an error if the directory cannot be found or the file saved.
	 * @abstract
	 */
	saveFile(fileContents, filename, encoding) {
		throw(this.constructor.name + " does not save files.");
	}

	/**
	 * This method is used by the application to copy a local file (generally the final result of running a ruleset)
	 * to a remote destination managed by the plugin.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the remote location.
	 * @param fileNameOrStream {string|stream} the absolute name of the local file to copy or a Readable stream to read the data from.
	 * @param remoteFileName {string} the name of the remote copy of the file.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @abstract
	 */
	putFile(fileNameOrStream, remoteFileName) {
		throw(this.constructor.name + " does not put files.");
	}

	/**
	 * This method is used by the application to get an in-memory copy of a log file managed by
	 * the plugin.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the local location.
	 * @param logFileName {string} the name of the log file to retrieve.
	 * @returns {string} the contents of the log file.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @abstract
	 */
	getLog(logFileName) {
		throw(this.constructor.name + " does not get logs.");
	}

	/**
	 * This method is used by the application to copy a remote file (generally the input to a ruleset) managed by
	 * the plugin to a local destination managed by this application.
	 * Derived classes should implement whatever is necessary to do this copy. An error should be thrown if the file
	 * cannot be copied to the local location.
	 * @param remoteFileName {string} the name of the remote copy of the file.
	 * @param localFileName {string} the absolute name of the local file to copy.
	 * @throws Throws an error if the copy cannot be completed successfully.
	 * @abstract
	 */
	getFile(remoteFileName, localFileName) {
		throw(this.constructor.name + " does not get files.");
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {DataAPI}
 */
module.exports = DataAPI;	// Export this so derived classes can extend it.
module.exports.instance = DataAPI;	// Export this so the application can instantiate the class without knowing it's name.
