const path = require('path');
const fs = require('fs');
const util = require('util');


function updateSummaries(log, level, ruleID, problemDescription, dataItemId) {

	if(!log.counts.hasOwnProperty(level)) {
		log.counts[level] = 1;
	} else {
		log.counts[level] += 1;
	}

	if(!log.rules.hasOwnProperty(ruleID)) {
		log.rules[ruleID] = {
			counts: {}
		};
	}

	const rule = log.rules[ruleID];

	if(!rule.counts.hasOwnProperty(level)) {
		rule.counts[level] = 1;
	} else {
		rule.counts[level] += 1;
	}

	if(dataItemId != null) {
		if(!log.dataItems.hasOwnProperty(dataItemId)) {
			log.dataItems[dataItemId] = {
				counts: {}
			};
		}

		const dataItem = log.dataItems[dataItemId];

		if(!dataItem.counts.hasOwnProperty(level)) {
			dataItem.counts[level] = 1;
		} else {
			dataItem.counts[level] += 1;
		}
	}



}

class ErrorLogger {
	constructor() {
		this.reports = [];
		this.counts = {};
		this.rules = {};
		this.dataItems = {};
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
	 * @param dataItemId the unique id of the item in a dataset being processed, null if NA
	 */
	log(level, problemFileName, ruleID, problemDescription, dataItemId) {
		level = level || "UNDEFINED";
		problemFileName = problemFileName || "";
		problemDescription = problemDescription || "";
		const dateStr = new Date().toLocaleString();

		const report = {
			type : level,
			when : dateStr,
			problemFile : problemFileName,
			ruleID : ruleID,
			description : problemDescription,
			dataItemId: dataItemId
		};
		this.reports.push(report);

		updateSummaries(this, level, ruleID, problemDescription, dataItemId);

		//console.log(util.inspect(report, {showHidden: false, depth: null}))
	}

	/*
	 * Get the array of reports.
	 */
	getLog() {
		return this.reports;
	}

	/**
	 * Get the counts of report types
	 */
	getCounts() {
		return this.counts;
	}

	/**
	 * Get the counts of report types for a given rule
	 */
	getRuleCounts(ruleID) {

		let rule = this.rules[ruleID];

		if(rule) {
			return rule.counts;
		}

		return null;
	}

	getCount(level, ruleID) {

		let counts = null;

		if(ruleID == null) {
			counts = this.getCounts();
		} else {
			counts = this.getRuleCounts(ruleID);
		}

		if(!counts || !counts[level]) {
			return 0;
		}

		return counts[level];
	}

	getDataItemCounts(dataItemId) {
		let dataitem = this.dataItems[dataItemId];

		if(dataitem) {
			return dataitem.counts;
		}

		return null;
	}

	getDataItemCount(dataItemId, level) {
		const counts = getDataItemCounts(dataItemId);

		if(!counts || !counts[level]) {
			return 0;
		}

		return counts[level];
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {ErrorLogger}
 */
module.exports = ErrorLogger;	// Export this so derived classes can extend it.
module.exports.instance = ErrorLogger;	// Export this so the application can instantiate the class without knowing it's name.
