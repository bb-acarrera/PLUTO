import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
  model() {
	  return RSVP.hash({
		  parsers: this.store.findAll('parser'),
		  defaultSources: this.store.query('configuredrule', {
			  perPage: 25,
			  typeFilter: 'source'
		  }),
		  defaultTargets: this.store.query('configuredrule', {
			  perPage: 25,
			  typeFilter: 'target'
		  })
	  });
  }
});
