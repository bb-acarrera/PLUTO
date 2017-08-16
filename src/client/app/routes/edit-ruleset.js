import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
    model(params) {
        return RSVP.hash({
            ruleset: this.store.findRecord('ruleset', params.ruleset_id),
            parsers: this.store.findAll('parser'),
            rules: this.store.findAll('rule')
        });
    },
    actions: {
        error(reason){
            alert(reason);
        }
    }
});
