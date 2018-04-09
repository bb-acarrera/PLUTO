import Ember from 'ember';

export default Ember.Route.extend({
    afterModel(transition) {
        if (this.get('currentUser.features.rejectAdminNavigation') && !this.get("currentUser.admin")) {
            alert('Sorry, you do not have sufficient privileges to see admin page.');
            this.transitionTo('index');
        }
    },
    model (params) {
        return this.get('store').findRecord('user', 'me').then((user) => {
            this.set("currentUser", user);
        });
    }
});
