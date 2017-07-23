const path = require('path');
const fs = require('fs');
const util = require('util');

class ErrorLogger {
	constructor() {
		this.reports = [];
	}

	/*
	 * This is called when the application has something to log. Derived classes can override this method
	 * to send the log to a file, a database, etc. This is the only method derived classes need to implement. The
	 * other methods, error(), warning(), and info() call this method. This implementation simply writes the log to the console.
	 * @param level the level of the log. One of LEVEL_ERROR, LEVEL_WARNING, and LEVEL_INFO. If null or undefined
	 * then LEVEL_INFO is assumed.
	 * @param problemFileName the name of the file causing the log to be generated.
	 * @param ruleID the ID of the rule raising the log report or undefined if raised by some file other than a rule.
	 * @param problemDescription a description of the problem encountered.
	 */
	log(level, problemFileName, ruleID, problemDescription) {
		level = level || "UNDEFINED";
		problemFileName = problemFileName || "";
		problemDescription = problemDescription || "";
		const dateStr = new Date().toLocaleString();

		const report = { type : level, when : dateStr, problemFile : problemFileName, ruleID : ruleID, description : problemDescription };
		this.reports.push(report);

		//console.log(util.inspect(report, {showHidden: false, depth: null}))
	}

	/*
	 * Get the array of reports.
	 */
	getLog() {
		return this.reports;
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {ErrorLogger}
 */
module.exports = ErrorLogger;	// Export this so derived classes can extend it.
module.exports.instance = ErrorLogger;	// Export this so the application can instantiate the class without knowing it's name.
