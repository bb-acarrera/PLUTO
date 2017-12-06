import Ember from 'ember';

export function ifIn([obj, list, ...rest]) {
	if (rest == null || rest.length == 0)
		return list.indexOf(obj) > -1;
	else if (rest.length >= 2)
		return list.indexOf(obj) > -1 ? rest[0] : rest[1];
	else
		return list.indexOf(obj) > -1 ? rest[0] : "";
}

export default Ember.Helper.helper(ifIn);
