import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Route.extend({
  model(params) {
      return this.store.findRecord('run', params.run_id).then(
          run => {
              return RSVP.hash({
                  file: params.run_id,
                  ruleset: this.store.findRecord('ruleset', run.get('ruleset')),
                  log: this.store.query('log', {
                    id: run.get('log'),
                    page: params.page,
                    size: params.perPage
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
    controller.set('page', 1);
  },
    actions: {
      error(reason){
          alert(reason);
      }
    }
});
