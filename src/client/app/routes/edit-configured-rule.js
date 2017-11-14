import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend( {
	poll: Ember.inject.service(),
	model ( params ) {

		return RSVP.hash( {
			rule: this.store.queryRecord( 'configuredrule', {id:params.rule_id} ),
			parsers: this.store.findAll( 'parser' ),
			rules: this.store.findAll( 'rule' ),
			importers: this.store.findAll( 'importer' ),
			exporters: this.store.findAll( 'exporter' )
		} );
	},
	actions: {
		error ( reason ) {
			alert( reason );
		}
	}
} );
