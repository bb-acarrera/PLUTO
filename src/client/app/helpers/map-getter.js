import Ember from 'ember';

export function mapGetter([map, item]) {
	// Because the exising get helper doesn't work for me.

	if(!map) {
		return;
	}

	if(map.get) {
		return map.get(item);
	}

	return map[item];
}

export default Ember.Helper.helper(mapGetter);
