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

/*
 * Export "instance" so the application can instantiate instances of this class without knowing the name of the class.
 * @type {LabelColumns}
 */
module.exports = LabelColumns;	// Export this so derived classes can extend it.
module.exports.instance = LabelColumns;	// Export this so the application can instantiate the class without knowing it's name.
