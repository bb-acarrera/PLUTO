const RuleAPI = require("../runtime/api/RuleAPI");

class RuleExampleUsingMethod extends RuleAPI {
	constructor(config) {
		super(config)
	}

	run() {
		let input = this.object;

		if (input instanceof Promise)
			return input.then((data) => {
				return this.asObject(data);
			});
		else
			return this.asObject(input);
	}
}

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {RuleAPI}
 */
module.exports = RuleExampleUsingMethod;
