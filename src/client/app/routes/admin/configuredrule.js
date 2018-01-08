import Ember from 'ember';
import RSVP from 'rsvp';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';
import RulesetEmberizer from '../../mixins/ruleset-emberizer';

export default Ember.Route.extend(RouteMixin, RulesetEmberizer, {
	queryParams: {
		page: {
			refreshModel: true
		},
		typeFilter: {
			refreshModel: true
		},
		ownerFilter: {
			refreshModel: true
		},
		ruleDescriptionFilter: {
			refreshModel: true
		}
	},
	loadQueryParams(params){
		this.transitionTo({queryParams: params});
	},
	model(params) {
		return RSVP.hash({
			rules: this.store.query('configuredrule', {
				page: params.page,
				perPage: params.perPage,
				ownerFilter: params.ownerFilter,
				typeFilter: params.typeFilter,
				descriptionFilter: params.ruleDescriptionFilter
			}).then((result) => {
				let meta = result.get('meta');

				result.forEach((rule) => {
					this.emberizeConfiguredRule(rule);
				});

				return { result: result, meta: meta};
			})

		})
	},
	actions: {
		error(reason){
			alert(reason);
		}
	}
});
