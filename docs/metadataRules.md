# Metadata Rules

Metadata rules are special case rules that do not operate on the data but operate on metadata associated
with the data. An example of metadata would be column labels for display in a UI for columns in a CSV file.

## 1. Overview

Through the use of metadata rules the validator can allow operations on data beyond what is included in
the original input file. This metadata can be shared with other metadata rules as well as all other
validator rules.

Rule constructors are called with a `config` object. One of the properties on this object is called
`sharedData`. This object starts with no content. Metadata rules, or regular rule, can then
add any content required. This same object is then shared with all the other rules.

What sets metadata rules apart of other rules is that the file data is never passed to them. They
can operate on the metadata and nothing else.

A metadata rule must derive from `MetadataRuleAPI` in `runtime/api` and must implement a constructor and the
method `updateMetadata()`.

## 2. Constructor

Like all other rules a metadata rule must include a constructor that takes a single argument, the configuration
object for the rule. This config. object is initialized with the contents from the ruleset for the rule
and then updated with several useful fields, including the `sharedData` object. The rule should save
a reference to this object.

## 3. `updateMetadata()`

This method will be called by the validator when this rule is executed. It takes no arguments. Instead
it should update the `sharedData` object as necessary.

## 4. Example

This example sets a `columnLabels` property on the `sharedData` object. The idea being that the `config`
for this rule would have a `columnLabels` property which contains an array of strings which are labels
for the columns for use in the UI, or for other rules to operate on columns by label rather than by
index.

```javascript
const MetadataRuleAPI = require('../api/MetadataRuleAPI');

class LabelColumns extends MetadataRuleAPI {
	constructor(localConfig) {
		super(localConfig); // The base class saves the config in this.config.
	}

	updateMetadata() {
		// Get the common sharedData object.
		const sharedData = config.sharedData;
		if (!sharedData)
			return; // No sharedData object so give up.

		// Save the rule's config for columnLabels in the sharedData object to share
		// with other rules.
		sharedData.columnLabels = config.columnLabels;
	}
}

module.exports = LabelColumns;
```