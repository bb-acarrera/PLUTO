import Ember from 'ember';

export default Ember.Component.extend({
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
