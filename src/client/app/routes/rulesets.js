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


				result.forEach((ruleset) => {
					this.emberizeRuleset(ruleset);
				});

				return {result: result, meta: meta};
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
