import Ember from 'ember';

export default Ember.Controller.extend({
	currentUser: null,
	updateCurrentUser: function() {
		this.get('store').findRecord('user', 'me').then((user) => {
			this.set("currentUser", user);
		});
	}.on('init')
});
