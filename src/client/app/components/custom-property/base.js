import Ember from 'ember';

function validate(ruleValidators, stateList, instanceName, itemName, value, oldValue, errorObject) {

	var validators;
	if (ruleValidators) {
		if (ruleValidators.get)
			validators = ruleValidators.get(itemName);
		else
			validators = ruleValidators[itemName];
	}

	if (validators && stateList && instanceName) {
		for (var i = 0; i < validators.length; i++) {
			const validator = validators[i];
			const result = validator(itemName, value, oldValue);

			if (typeof result == 'string') {

				setError(stateList, itemName, instanceName);

				if (errorObject)
					errorObject.set('error', result);

				return;		// Remember the first error for this ui property only.
			}
		}

		// No failures so remove this item from the stateList, if it's there, and do any cleanup
		if (errorObject)
			errorObject.set('error', undefined);

		let result = findState(stateList, itemName, instanceName);
		if(result) {
			result.item.set('invalid', false);
		}
	}
}

function findState(stateList, itemName, instanceName) {
	if (stateList && itemName && instanceName) {
		let id = instanceName + '::' + itemName;
		let foundIndex  = -1;
		let item = stateList.find((item, index) => {
			if(item.get('id') === id) {
				foundIndex = index;
				return true;
			}

			return false;
		});

		if(item) {
			return {index: foundIndex, item: item};
		}

		return null;
	}
}

function removeState(stateList, itemName, instanceName) {
	let result = findState(stateList, itemName, instanceName);

	if (result) {
		stateList.removeAt(result.index);
	}

}

function findOrCreateState(stateList, itemName, instanceName) {
	if (stateList && itemName && instanceName) {

		let result = findState(stateList, itemName, instanceName);

		let state;

		if (result == null) {

			state = Ember.Object.create({
				id: instanceName + '::' + itemName
			});

			stateList.pushObject(state)
		} else {
			state = result.item;
		}

		return state;
	}
}

function setError(stateList, itemName, instanceName) {

	let state = findOrCreateState(stateList, itemName, instanceName);

	if(state) {
		state.set('invalid', true);
	}

}

export default Ember.Component.extend({
	tagName: "",
	init() {
		this._super(...arguments);

		if(this.get('validateOnInit') === true) {
			const config = this.get('config');
			const itemName = this.get('uiItem.name');
			const value = this.get('value');
			const ruleValidators = this.get('validators');
			const stateList = this.get('state');
			const instanceName = this.get('instanceName');
			const errorObject = this.get('errorObject');

			if(config && itemName) {
				var oldValue;
				if(config.get) {
					oldValue = config.get(itemName);
				} else {
					oldValue = config[itemName];
				}

				validate.call(this, ruleValidators, stateList, instanceName, itemName, value, oldValue, errorObject);
			}
		}

	},
	willDestroyElement() {
		this._super(...arguments);

		const itemName = this.get('uiItem.name');
		const stateList = this.get('state');
		const instanceName = this.get('instanceName');

		removeState(stateList, itemName, instanceName);

	},
	valueChanged: Ember.observer('value', function() {
		const config = this.get('config');
		const itemName = this.get('uiItem.name');
		const value = this.get('value');
		const ruleValidators = this.get('validators');
		const stateList = this.get('state');
		const instanceName = this.get('instanceName');
		const errorObject = this.get('errorObject');

		if(config && itemName) {
			var oldValue;
			if(config.set) {
				oldValue = config.get(itemName);
				config.set(itemName, value)
			} else {
				oldValue = config[itemName];
				config[itemName] = value;
			}

			validate.call(this, ruleValidators, stateList, instanceName, itemName, value, oldValue, errorObject);
		}
	})
});
