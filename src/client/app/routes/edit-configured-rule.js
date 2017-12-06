import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend( {
	poll: Ember.inject.service(),
	model ( params ) {

		return RSVP.hash( {
			rule: this.store.queryRecord( 'configuredrule', {id:params.rule_id} ),
			importers: this.store.findAll( 'importer' ),
			exporters: this.store.findAll( 'exporter' ),
			defaultTargets: this.store.query('configuredrule', {
				perPage: 25,
				typeFilter: 'target'
			})
		} );
	},
	actions: {
		error ( reason ) {
			alert( reason );
		}
	}
} );
