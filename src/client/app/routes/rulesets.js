import Ember from 'ember';
import RSVP from 'rsvp';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';
import RulesetEmberizer from '../mixins/ruleset-emberizer';

export default Ember.Route.extend(RouteMixin, RulesetEmberizer, {
	queryParams: {
		page: {
			refreshModel: true
		},
		rulePage: {
			refreshModel: true
		},
		rulesetFilter: {
			refreshModel: true
		},
		filenameFilter: {
			refreshModel: true
		},
		showErrors: {
			refreshModel: true
		},
		rulesetNameFilter: {
			refreshModel: true
		},
		rulesetGroupFilter: {
			refreshModel: true
		},
		runGroupFilter: {
			refreshModel: true
		},
		processing: {
			refreshModel: true
		},
		sourceDescriptionFilter: {
			refreshModel: true
		},
		fileFilter: {
			refreshModel: true
		}
	},
	loadQueryParams(params){
		this.transitionTo({queryParams: params});
	},
	model(params) {
		return RSVP.hash({
			rulesets: this.store.query('ruleset', {
				page: params.rulePage,
				perPage: params.rulePerPage,
				groupFilter: params.rulesetGroupFilter,
				sourceDescriptionFilter: params.sourceDescriptionFilter,
				fileFilter: params.fileFilter,
				nameFilter: params.rulesetNameFilter
			}).then((result) => {
				let meta = result.get('meta');

				let rulesetIds = [];

				result.forEach((ruleset) => {
					this.emberizeRuleset(ruleset);
					rulesetIds.push(ruleset.get('ruleset_id'));
				});

				this.store.query('run', {
					perPage: rulesetIds.length + 1,
					rulesetIdListFilter: rulesetIds
				}).then(function (runs) {
					runs.forEach((run) => {
						let ruleset =  result.find((rulesetItem) => {
							return rulesetItem.get('ruleset_id') === run.get('ruleset');
						});

						if(ruleset) {
							ruleset.set('run', run);
						}
					})

				});

				return {
					result: result,
					meta: meta
				}
			}),
			parsers: this.store.findAll('parser'),
			defaultSources: this.store.query('configuredrule', {
				perPage: 25,
				typeFilter: 'source'
			}),
			defaultTargets: this.store.query('configuredrule', {
				perPage: 25,
				typeFilter: 'target'
			})
		})
	},
	actions: {
		error(reason){
			alert(reason);
		},
		willTransition (transition) {
			if (transition.targetName != "rulesets" && this.controller) {
				this.controller.get('poll').stopAll();
				this.controller.get('poll').clearAll();
			}
		}
	}
});
