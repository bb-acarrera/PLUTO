const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingMethod extends RuleAPI {
	constructor(config) {
		super(config)
	}

	useMethod(data) {
		setImmediate(() => {
			this.emit(RuleAPI.NEXT, data);
		});
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingMethod;
