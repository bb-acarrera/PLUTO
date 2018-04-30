import Ember from 'ember';

export default Ember.Controller.extend({
	currentUser: null,
    environmentStyles: null,
	updateCurrentUser: function() {
		this.get('store').findRecord('user', 'me').then((user) => {
			this.set("currentUser", user);

			let styles = user.get('features.environmentStyle');

			if(styles) {
				this.set("environmentStyles", styles[user.get('features.environmentLabel')]);
			}

            
		});
	}.on('init')
});
