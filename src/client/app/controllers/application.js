import Ember from 'ember';

export default Ember.Controller.extend({
	currentUser: null,
    environmentStyles: null,
	updateCurrentUser: function() {
		this.get('store').findRecord('user', 'me').then((user) => {
			this.set("currentUser", user);
            this.set("environmentStyles", user.get('features.environmentStyle')[user.get('features.environmentLabel')]);
		});
	}.on('init')
});
