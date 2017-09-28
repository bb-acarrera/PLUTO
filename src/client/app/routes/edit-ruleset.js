import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
    model(params) {
        // This is necessary for clean page load on return to the page
        if(this.controller && this.controller.ruleToEdit) {
          this.controller.set('ruleToEdit', null);
        }
        return RSVP.hash({
            ruleset: this.store.findRecord('ruleset', params.ruleset_id),
            parsers: this.store.findAll('parser'),
            rules: this.store.findAll('rule'),
            importers: this.store.findAll('importer'),
            exporters: this.store.findAll('exporter')
        });
    },
    actions: {
        error(reason){
            alert(reason);
        }
    }
});
