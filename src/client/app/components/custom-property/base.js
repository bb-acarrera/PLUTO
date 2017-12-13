import Ember from 'ember';
import Changeset from 'ember-changeset';
import * as Validators from 'ember-changeset-validations/validators';
import lookupValidator from 'ember-changeset-validations';

export default Ember.Component.extend({
	init() {
		this._super(...arguments);
		const validations = this.get('uiItem.validations');
		if (validations && validations instanceof Array) {
			const itemName = this.get('uiItem.name');
			const config = this.get('config');
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
			const compValidator = {};
			compValidator[itemName] = validators;

			this.changeset = new Changeset(config, lookupValidator(compValidator), compValidator);
		}
	},
	tagName: "",
	valueChanged: Ember.observer('value', function() {
		const config = this.get('config');
		const itemName = this.get('uiItem.name');
		const value = this.get('value');

		if(config && itemName) {
			if(config.set) {
				config.set(itemName, value)
			} else {
				config[itemName] = value;
			}
		}
	})
});
