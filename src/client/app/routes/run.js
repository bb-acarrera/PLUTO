import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({

    model(params) {
        return this.store.findRecord('run', params.run_id).then(
            run => {
                return RSVP.hash({
                    file: params.run_id,
                    ruleset: this.store.findRecord('ruleset', run.get('ruleset')),
                    log: this.store.findRecord('log', run.get('log')),
                    rules: this.store.findAll('rule')
                });
            });
    },
    actions: {
        error(reason) {
            alert(reason); // "FAIL"

            // Can transition to another route here, e.g.
            // this.transitionTo('index');

            // Uncomment the line below to bubble this error event:
            // return true;
        }
    }
});



