import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
  queryParams: {
    page: {
      refreshModel: true
    },
    ruleid: {
      refreshModel: true
    },
    type: {
      refreshModel: true
    }
  },
  model(params) {
      return this.store.findRecord('run', params.run_id).then(
          run => {

              let ruleset = run.get('ruleset');

              return RSVP.hash({
                  run: run,
                  file: params.run_id,
                  ruleset: ruleset? this.store.findRecord('ruleset', ruleset) : null,
                  log: this.store.query('log', {
                    id: run.get('log'),
                    page: params.page,
                    size: params.perPage,
                    ruleid: params.ruleid,
                    type: params.type
                  }).then(function (result) {
                    let meta = result.get('meta');
                    return { result: result, meta: meta};
                  }),
                  rules: this.store.findAll('rule')
              });
          });
  },
  setupController(controller, model) {
    this._super(...arguments);
  },
    actions: {
      error(reason){
          alert(reason);
      }
    }
});
