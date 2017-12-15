import Ember from 'ember';
import DS from 'ember-data';
import { validator, buildValidations } from 'ember-cp-validations';
import * as Validators from 'ember-changeset-validations/validators';

//see http://offirgolan.github.io/ember-cp-validations/

const Validations = buildValidations({
	base: [
		validator('presence', true)
	],
	description: [
		validator('presence', true)
	]
});

export default DS.Model.extend(Validations, {
	description : DS.attr('string'),
	rule_id : DS.attr('string'),
	database_id : DS.attr('string'),
	config : DS.attr(),
	type : DS.attr('string'),
	base : DS.attr('string'),
	version: DS.attr('number'),
	canedit: DS.attr('boolean'),
	ownerGroup: DS.attr('string'),
	updateUser: DS.attr('string'),
	updateTime: DS.attr('date'),
	deleted: DS.attr('boolean'),
	ui: DS.attr(),

	validators: Ember.computed('ui', function() {
		var uiList = this.get('ui.properties');
		var results = {};
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
					for (var j = 0; j < validations.length; j++) {
						const validation = validations[j];
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
			
								// Special case. Need to compile regex strings.
								if (key == "format") {
									let args = Object.keys(validationArgs);
									for (var k = 0; k < args.length; k++) {
										let arg = args[k];
										if (arg == "regex") {
											let regexStr = validationArgs[arg];
											if (typeof regexStr == 'string')
												validationArgs[arg] = new RegExp(regexStr);
										}
									}
								}
								validators.push(validator(validationArgs));
							}
							else {
								console.error(`${fnName} is not a valid validator function.`);
							}
						}
					}
					results[itemName] = validators;
				}
			}
		}
		return results;
	})
});
