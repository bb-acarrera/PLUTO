const MetadataRuleAPI = require('../api/MetadataRuleAPI');

class LabelColumns extends MetadataRuleAPI {
	constructor(localConfig) {
		super(localConfig);
	}

	updateMetadata() {
		const sharedData = config.sharedData;
		if (!sharedData)
			return;

		sharedData.columnLabels = config.columnLabels;
	}
}

module.exports = LabelColumns;
