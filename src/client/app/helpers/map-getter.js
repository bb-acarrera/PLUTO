import Ember from 'ember';

export function mapGetter([map, item]) {
	// Because the exising get helper doesn't work for me.
	return map.get(item);
}

export default Ember.Helper.helper(mapGetter);
