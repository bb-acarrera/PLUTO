import Ember from 'ember';
import Base from './base';

export default Base.extend({
	listValue: Ember.computed('value', {
		get() {
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
