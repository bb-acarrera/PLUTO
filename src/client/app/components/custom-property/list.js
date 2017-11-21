import Ember from 'ember';

export default Ember.Component.extend({
	listValue: Ember.computed('config', 'uiItem.name', {
		get(key) {
			const prop = this.get('uiItem.name');
			const list = this.get('config.' + prop);

			if(!Array.isArray(list)) {
				return '';
			}

			return list.toString();
		},
		set(key, value) {
			const list = value.split(',');
			const prop = this.get('uiItem.name');

			this.set('config.' + prop, list);

			return value;
		}
	})
});
