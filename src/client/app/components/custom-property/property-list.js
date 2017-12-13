import Ember from 'ember';
import * as Validators from 'ember-changeset-validations/validators';

export default Ember.Component.extend({
	validations: {},
	init() {
		this._super(...arguments);
		
		const uiList = this.get('uiList');
		if (uiList) {
			for (var i = 0; i < uiList.length; i++) {
				const uiItem = uiList[i];

				var validations;
				var itemName;
				if (uiItem.get) {
					validations = uiItem.get('validations');
					itemName = uiItem.get('name');
				}
				else {
					validations = uiItem.validations;
					itemName = uiItem.name;
				}
				
				if (validations && validations instanceof Array) {
					var validators = [];
					for (var i = 0; i < validations.length; i++) {
						const validation = validations[i];
						for (var key in validation) {
							// Really expect only one key, but can't hurt to check all.
							const fnName = "validate" + key.charAt(0).toUpperCase() + key.slice(1);
							var validator = Validators[fnName];
							if (validator) {
								var validationArgs;
								if (validation.get)
									validationArgs = validation.get(key);
								else
									validationArgs = validation[key];
			
									validators.push(validator(validationArgs));
							}
							else {
								console.error(`${fnName} is not a valid validator function.`);
							}
						}
					}
					var v = this.get('validations');
					v[itemName] = validators;
				}
			}
		}
	},
	actions: {
		validate({ key, newValue, oldValue, changes, content }) {
			var validations = this.get('validations');

			if (!validations)
				return true;	// No validations, so can't fail.

			var validators;
			if (validations.get)
				validators = validations.get(key);
			else
				validators = validations[key];
			
			if (!validators)
				return true;	// No validations for this UI item.

			for (var i = 0; i < validators.length; i++) {
				const validator = validators[i];
				const result = validator(key, newValue, oldValue, changes, content);
				if (typeof result == 'string')
					return result;	// Only return the first error. Could return all of them.
			}
			return true;
		}
	}
});
