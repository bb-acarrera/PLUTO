import Ember from 'ember';

export function customPropertyType([type]) {

	switch (type) {
		case 'boolean':
			return type;
		case 'choice':
			return type;
		case 'column':
			return type;
		case 'date':
			return type;
		case 'float':
		case 'number':
			return 'number';
		case 'integer':
			return type;
		case 'time':
			return type;
		case 'string':
			return type;
	}
	return 'string';
}

export default Ember.Helper.helper(customPropertyType);
