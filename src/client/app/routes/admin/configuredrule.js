import Ember from 'ember';
import RSVP from 'rsvp';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend(RouteMixin, {
	queryParams: {
		page: {
			refreshModel: true
		},
		ruleFilter: {
			refreshModel: true
		},
		groupFilter: {
			refreshModel: true
		},
		typeFilter: {
			refreshModel: true
		},
		ownerFilter: {
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
				ruleFilter: params.ruleFilter,
				groupFilter: params.groupFilter,
				ownerFilter: params.ownerFilter,
				typeFilter: params.typeFilter
			}).then(function (result) {
				let meta = result.get('meta');
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
