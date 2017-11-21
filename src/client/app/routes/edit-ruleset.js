import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
	poll: Ember.inject.service(),
	model (params) {
		// This is necessary for clean page load on return to the page
		if (this.controller && this.controller.ruleToEdit) {
			this.controller.set('ruleToEdit', null);
		}

		return this.store.queryRecord('ruleset', {id: params.ruleset_id}).then(
			ruleset => {
				let source = null;
				let target = null;
				let sourceFilename = ruleset.get('source.filename');
				let targetFilename = ruleset.get('target.filename');
				if (sourceFilename) {
					source = this.store.queryRecord('configuredrule', {id: sourceFilename})
				}

				if (targetFilename) {
					target = this.store.queryRecord('configuredrule', {id: targetFilename})
				}

				return RSVP.hash({
					ruleset: ruleset,
					parsers: this.store.findAll('parser'),
					rules: this.store.findAll('rule'),
					importers: this.store.findAll('importer'),
					exporters: this.store.findAll('exporter'),
					rulesetconfiguis: this.store.findAll('rulesetconfigui'),
					source: source,
					target: target
				});
			}
		);


	},
	actions: {
		error (reason) {
			alert(reason);
		},
		willTransition () {
			if (this.controller) {
				let pollId = this.controller.get('pollId');
				this.controller.get('poll').stopPoll(pollId);
			}
		}
	}
});
