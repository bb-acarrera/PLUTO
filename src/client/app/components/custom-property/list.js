import Ember from 'ember';

export default Ember.Component.extend({
	listValue: Ember.computed('config', 'uiItem.name', {
		get(key) {
			const list = this.get('value');

			if(!Array.isArray(list)) {
				return '';
			}

			return list.toString();
		},
		set(key, value) {
			const list = value.split(',');

			this.set('value', list);

			return value;
		}
	})
});
