import Ember from 'ember';
import RSVP from 'rsvp';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend(RouteMixin, {
  queryParams: {
    page: {
      refreshModel: true
    }
  },
  model(params) {
    return RSVP.hash({
      rulesets: this.store.findAll('ruleset'),
      runs: this.store.query('run', params).then(function (result) {
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
