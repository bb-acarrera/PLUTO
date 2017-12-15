import Ember from 'ember';

export default Ember.Component.extend({
	tagName: "",
	valueChanged: Ember.observer('value', function() {
		const config = this.get('config');
		const itemName = this.get('uiItem.name');
		const value = this.get('value');
		const ruleValidators = this.get('validators');
		const state = this.get('state');
		const instanceName = this.get('instanceName');

		var validators;
		if (ruleValidators) {
			if (ruleValidators.get)
				validators = ruleValidators.get(itemName);
			else
				validators = ruleValidators[itemName];
		}

		if(config && itemName) {
			var oldValue;
			if(config.set) {
				oldValue = config.get(itemName);
				config.set(itemName, value)
			} else {
				oldValue = config[itemName];
				config[itemName] = value;
			}

			if (validators && state && instanceName) {
				var ruleState = state.get(instanceName);
				for (var i = 0; i < validators.length; i++) {
					const validator = validators[i];
					const result = validator(itemName, value, oldValue);

					if (typeof result == 'string') {
						if (!ruleState) {
							ruleState = Ember.Object.create();
							state.set(instanceName, ruleState);
						}

						ruleState.set(itemName, result);
						state.set("invalid", true);
						
						return;		// Remember the first error for this ui property only.
					}
				}

				// No failures so remove this item from the state, if it's there, and do any cleanup
				if (ruleState) {
					if (ruleState.get(itemName)) {
						// Yes. Delete does work as expected on Ember objects.
						// Delete this property from the rule.
						delete ruleState[itemName];
					}
					if (Object.keys(ruleState).length == 0) {
						// The rule is empty, i.e. no failures at all, so remove it.
						delete state[instanceName];
					}

					console.log("state has " + Object.keys(state))
					if (Object.keys(state).length == 1)	// If "invalid" is the only key.
						state.set("invalid", false);

					// TODO: Refactor to be a function.
				}
			}
		}
	})
});
