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
    }
  },
  loadQueryParams(params){
    this.transitionTo({queryParams: params});
  },
  model(params) {
    console.log("index model");
    return RSVP.hash({
      rulesets: this.store.query('ruleset', {
        page: params.rulePage,
        perPage: params.rulePerPage
      }).then(function (result) {
          let meta = result.get('meta');
          return { result: result, meta: meta};
        }),
      runs: this.store.query('run', {
        page: params.rulePage,
        perPage: params.rulePerPage,
        rulesetFilter: params.rulesetFilter,
        filenameFilter: params.filenameFilter
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
