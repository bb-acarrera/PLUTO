import Ember from 'ember';

export default Ember.Controller.extend({
	applicationController: Ember.inject.controller('application'),
	actions: {
		setShowAddRuleset() {
			this.set('showAddRuleset', true);
		},
        transitionTo(location, filter, value) {
			if(value) {
                this.transitionToRoute( location, { queryParams: { "filter": value } } );
            } else {
                this.transitionToRoute( location );
			}
        }
	}
});
