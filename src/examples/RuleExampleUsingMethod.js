const RuleAPI = require("../api/RuleAPI");

class RuleExampleUsingMethod extends RuleAPI {
	constructor(config) {
		super(config)
	}

	canUseMethod() {
		return true;
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
module.exports = RuleExampleUsingMethod;	// Export this so derived classes can extend it.
module.exports.instance = RuleExampleUsingMethod;	// Export this so the application can instantiate the class without knowing it's name.
