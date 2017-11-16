import Ember from 'ember';
import RSVP from 'rsvp';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend(RouteMixin, {
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
//    showWarnings: {
//      refreshModel: true
//    },
//    showNone: {
//      refreshModel: true
//    },
//    dateFilter: {
//      refreshModel: true
//    },
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
          rulesetFilter: params.rulesetNameFilter,
          groupFilter: params.rulesetGroupFilter
      }).then(function (result) {
          let meta = result.get('meta');
          return { result: result, meta: meta};
        }) // ,
//      runs: this.store.query('run', {
//        page: params.page,
//        perPage: params.perPage,
//        rulesetFilter: params.rulesetFilter,
//        filenameFilter: params.filenameFilter,
//        errorFilter: params.showErrors,
//        warningsFilter: params.showWarnings,
//        noneFilter: params.showNone,
//        dateFilter: params.dateFilter,
//	    groupFilter: params.runGroupFilter
//      }).then(function (result) {
//        let meta = result.get('meta');
//        return { result: result, meta: meta};
//      })
    })
  },
  actions: {
    error(reason){
      alert(reason);
    },
    willTransition (transition) {
        if ( transition.targetName != "rulesets" && this.controller ) {
            this.controller.get( 'poll' ).stopAll();
            this.controller.get( 'poll' ).clearAll();
            this.controller.get( 'processing' ).clear();	// Leaving the page so forget everything.
            this.controller.get( 'goodRuns' ).clear();
            this.controller.get( 'warningRuns' ).clear();
            this.controller.get( 'errorRuns' ).clear();
			this.controller.get( 'mixedRuns' ).clear();
            this.controller.get( 'pollMap' ).clear();
            this.controller.get( 'runMap' ).clear();
        }
    }
    }
});
