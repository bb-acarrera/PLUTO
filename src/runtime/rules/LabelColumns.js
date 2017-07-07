const MetadataRuleAPI = require('../api/MetadataRuleAPI');

class LabelColumns extends MetadataRuleAPI {
	constructor(localConfig) {
		super(localConfig);
	}

	updateMetadata() {
		const sharedData = config.SharedData;
		if (!sharedData)
			return;

		sharedData.ColumnLabels = config.ColumnLabels;
	}
}

module.exports = LabelColumns;	// Export this so derived classes can extend it.
