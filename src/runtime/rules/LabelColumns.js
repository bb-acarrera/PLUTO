const MetadataRuleAPI = require('../api/MetadataRuleAPI');

class LabelColumns extends MetadataRuleAPI {
	constructor(localConfig) {
		super(localConfig);
	}

	run() {
		const sharedData = this.config.sharedData;
		if (!sharedData)
			return;

		sharedData.columnLabels = this.config.columnLabels;
	}
}

module.exports = LabelColumns;
