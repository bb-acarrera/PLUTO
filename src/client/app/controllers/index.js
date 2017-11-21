import Ember from 'ember';

export default Ember.Controller.extend({
	applicationController: Ember.inject.controller('application'),
	actions: {
		setShowAddRuleset() {
			this.set('showAddRuleset', true);
		}
	}
});
