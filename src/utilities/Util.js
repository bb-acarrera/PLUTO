const path = require("path");
const RuleSet = require("../validator/RuleSet");
const fs = require('fs-extra');
class Util {
	/*
	 * Retrieve a ruleset description.
	 * @param rootDir the directory that may contain the ruleset file.
	 * @param ruleset the name of the ruleset or a ruleset (which is then just returned).
	 * @return an object describing a ruleset.
	 */
	static retrieveRuleset(rootDir, ruleset, rulesetOverrideFile) {
		if (typeof ruleset === 'string') {
			// Identifying a file to load.
			const rulesetFile = path.resolve(rootDir, ruleset);
			var contents;
			try {
				contents = require(rulesetFile);
			}
			catch (e) {
				throw("Failed to load ruleset file \"" + rulesetFile + "\".\n\t" + e);
			}

			if (!contents.RuleSet) {
				throw("Ruleset file \"" + rulesetFile + "\" does not contain a RuleSet member.");
			}

			contents.RuleSet.filename = ruleset;
			contents.RuleSet.name = contents.RuleSet.name || contents.RuleSet.filename;
			ruleset = contents.RuleSet;
		}

		if(rulesetOverrideFile && typeof rulesetOverrideFile === 'string') {
			var contents;
			try {
				contents = require(rulesetOverrideFile);
			}
			catch (e) {
				throw("Failed to load ruleset override file \"" + rulesetOverrideFile + "\".\n\t" + e);
			}

			if(contents.import) {
				if(!ruleset.import) {
					ruleset.import = {};
				}

				Object.assign(ruleset.import.Config, contents.import);
			}

			if(contents.export) {
				if(!ruleset.export) {
					ruleset.export = {};
				}

				Object.assign(ruleset.export, contents.export);
			}
		}

		return new RuleSet(ruleset);
	}

	/*
	 * Get the name of a rule given a rule description
	 * @param ruleDescriptor the object describing the rule.
	 */
	static getRuleName(ruleDescriptor) {
		return ruleDescriptor.name || ruleDescriptor.Name || path.basename(ruleDescriptor.filename);
	}

	static getRulesets(rootDir) {
		var rulesets = [];

		fs.readdirSync(rootDir).forEach(file => {
			if(file.substr(file.length-5) === '.json') {
				rulesets.push(file);
			}
		});

		return rulesets;
	}



	static getRootDirectory(config) {

		// Get the root directory for everything.
		let rootDir = path.dirname(config.scriptName);	// Default is the directory this script lives in.
		if (config.RootDirectory) {
			rootDir = path.resolve(config.RootDirectory);	// Don't check for read/write/exist as this leads to possible race conditions later. Instead check at time of access.
			if (!rootDir.endsWith(path.sep))
				rootDir = rootDir + path.sep;
		}
		return rootDir;
	}

	static getRootTempDirectory(config, rootDir) {
		let tmpDir;
		if (config.TempDirectory)
			tmpDir = config.TempDirectory;
		else
			tmpDir = "tmp";

		// Make absolute.
		tmpDir = path.resolve(rootDir, tmpDir);

		// Make sure the parent directory exists.
		try {
			fs.accessSync(tmpDir, fs.constants.R_OK | fs.constants.W_OK | fs.constants.F_OK);
		}
		catch (e) {
			try {
				fs.mkdirSync(tmpDir);
			}
			catch (e) {
				throw "Failed to create \"" + tmpDir + ".\n" + e;
			}
		}

		return tmpDir;
	}

	static getTempDirectory(config, rootDir) {

		let tmpDir = this.getRootTempDirectory(config, rootDir);

		// Create a temporary child directory.
		let basename = path.basename(config.scriptName, ".js");
		tmpDir = path.resolve(tmpDir, basename + this.createGUID());

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
		})};
}

module.exports = Util;
