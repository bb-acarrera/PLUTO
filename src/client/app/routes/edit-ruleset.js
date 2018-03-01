import Ember from 'ember';
import RSVP from 'rsvp';
import RulesetEmberizer from '../mixins/ruleset-emberizer';

export default Ember.Route.extend(RulesetEmberizer, {
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

				this.emberizeRuleset(ruleset);

				return RSVP.hash({
					ruleset: ruleset,
					parsers: this.store.findAll('parser'),
					rules: this.store.findAll('rule'),
					importers: this.store.findAll('importer'),
					exporters: this.store.findAll('exporter'),
					reporters: this.store.findAll('reporter'),
					rulesetconfiguis: this.store.findAll('rulesetconfigui'),
                    custom: this.store.findAll('customfield'),
					source: source,
					target: target,
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
		);


	},
	actions: {
		error (reason) {
			alert(reason);
		},
		willTransition (transition) {
			transition.send('willTransition', transition);

			if (this.controller) {
				let pollId = this.controller.get('pollId');
				this.controller.get('poll').stopPoll(pollId);
			}
		}
	}
});
