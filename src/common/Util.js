const path = require("path");
const fs = require('fs-extra');
class Util {

	/*
	 * Get the name of a rule given a rule description
	 * @param ruleDescriptor the object describing the rule.
	 */
	static getRuleName(ruleDescriptor) {
		return ruleDescriptor.name || ruleDescriptor.name || path.basename(ruleDescriptor.filename);
	}

	static getRootDirectory(config) {

		// Get the root directory for everything.
		let rootDir = '.';	// Default is the current working directory.
		if (config && config.rootDirectory) {
			rootDir = path.resolve(config.rootDirectory);	// Don't check for read/write/exist as this leads to possible race conditions later. Instead check at time of access.
			if (!rootDir.endsWith(path.sep))
				rootDir = rootDir + path.sep;
		}
		else if (config && config.__state && config.__state.rootDirectory) {
            rootDir = path.resolve(config.__state.rootDirectory);   // Don't check for read/write/exist as this leads to possible race conditions later. Instead check at time of access.
            if (!rootDir.endsWith(path.sep))
                rootDir = rootDir + path.sep;
        }
		
		return rootDir;
	}

	static getRootTempDirectory(config, rootDir) {
		return "/tmp";  // Always use /tmp.
	}

	static getTempDirectory(config, rootDir) {

		let tmpDir = this.getRootTempDirectory(config, rootDir);

		// Create a temporary child directory.
		tmpDir = path.resolve(tmpDir, this.createGUID());

		try {
			fs.mkdirSync(tmpDir);
		}
		catch (e) {
			// Can't create the tmpdir so give up.
			throw "Failed to create \"" + tmpDir + ".\n" + e;
		}

		return tmpDir;
	}

	static createGUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		})
	}

	static getCurrentDateTimeString() {
		const currentdate = new Date();
		return currentdate.getFullYear() + "_" +
			(currentdate.getMonth()+1) + "_" +
			currentdate.getDate() + "_" +
			currentdate.getHours() + "_" +
			currentdate.getMinutes() + "_" +
			currentdate.getSeconds();
	}

	static getTempFileName(tempDir) {
		const filename = Util.createGUID();
		return path.resolve(tempDir, filename);
	}

	static recursiveSubStringReplace (source, replaceFn) {

		function recursiveReplace (objSource) {
			if (typeof objSource === 'string') {
				return replaceFn(objSource);
			} else if (typeof objSource === 'object') {
				if (objSource === null) {
					return null;
				}

				Object.keys(objSource).forEach(function (property) {
					objSource[property] = recursiveReplace(objSource[property]);
				});

				return objSource;
			}

			return objSource;
		}

		return recursiveReplace(source);
	}

	static replaceStringWithEnv(source) {
		if(!source || source.length == 0) {
			return source;
		}

		let result = source;
		let offset = result.indexOf('${');
		let endOffset = -1;
		let val,env;
		while(offset >= 0) {
			endOffset = result.indexOf('}', offset);

			if(endOffset <= 0) { //bad string, bail
				return result;
			}

			val = result.substring(offset+2, endOffset);
			env =  process.env[val] || "";

			result = result.replace('${' + val + '}', env);

			offset = result.indexOf('${');
		}

		return result;
	}

}

module.exports = Util;
