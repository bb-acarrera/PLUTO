const TableRuleAPI = require("../../api/TableRuleAPI");
const request = require('request');
const Bottleneck = require('bottleneck');

/** AddRestAPIColumnBase is the base class to support REST API calls
 *  Expects newColumnName, getRequest, and handleResponse  to be implemented by derived classes
 */

class AddRestAPIColumnBase extends TableRuleAPI {
	constructor(config, parser) {
		super(config, parser);

		this.maxConcurrent = this.config.maxConcurrent == null || isNaN(this.config.maxConcurrent) ? 100 : this.config.maxConcurrent;

		this.limiter = new Bottleneck(this.maxConcurrent);

	}

	get processHeaderRows() {
		return true;
	}

	start() {
		if(this.newColumnIndex == null && this.parser) {
			this.newColumnIndex = this.parser.addColumn(this.newColumnName);
		}
	}

	processRecord(record, rowId, isHeaderRow) {

		if(this.newColumnIndex == null) {
			this.newColumnIndex = record.length;
		}

		return new Promise((resolve) => {
			while(record.length <= this.newColumnIndex) {
				record.push(null);
			}

			if(isHeaderRow) {
				record[this.newColumnIndex] = this.config.newColumn;
				resolve(record);
			} else {

				try{
					const options = this.request(record, rowId);
					this.limiter.submit(request, options, (error, response, body) => {
						record[this.newColumnIndex] = this.handleResponse(error, body, record, rowId);
						resolve(record);
					});
				} catch (e) {
					this.error('HTTP request exception: ' + e);
					resolve(record);
				}

			}
		});
	}

	/**
	 * Must return a Request custom HTTP header object, see https://github.com/request/request#custom-http-headers
	 * @param record the current record
	 * @param rowId the current record's rowId
	 * @returns {object} the request options (see https://github.com/request/request#custom-http-headers)
	 */
	request(record, rowId) {
		return null
	}

	/**
	 *
	 * @param error the error code
	 * @param the response body
	 * @param record the current record
	 * @param rowId the current record's rowId
	 * @returns {value} the value to put in the new column, or null if problem
	 */
	handleResponse(error, body, record, rowId) {
		return null;
	}

	get newColumnName() {
		throw 'newColumnName not implemented';
	}

	/**
	 * Append config properties to a supplied list
	 * @param inProperties the list of properties to append to
	 * @returns {Array}
	 */
	static appendConfigProperties(inProperties) {

		const properties = [
			{
				name: 'maxConcurrent',
				label: 'Max concurrent connections',
				type: 'number'
			}
		];

		let props;

		if(inProperties) {
			props = inProperties.concat(properties);
		} else {
			props = [].concat(properties);
		}

		return BaseRuleAPI.appendConfigProperties(props);
	}

	/**
	 * Append config defaults to a supplied list
	 * @param inDefaults the defaults to append to
	 * @returns {Object}
	 */
	static appendDefaults(inDefaults) {

		const defaults = {
			maxConcurrent: 100
		};

		let defs;

		if(inDefaults) {
			defs = Object.assign({}, inDefaults, defaults);
		} else {
			defs = Object.assign({}, defaults);
		}

		return BaseRuleAPI.appendDefaults(defs);
	}

}

module.exports = AddRestAPIColumnBase;
