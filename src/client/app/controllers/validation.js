import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['file', 'ruleset', 'log'],
  file: null,
  ruleset: null,
  log: null,
  actions: {
    showErrors(rule) {
      console.log(`Show ${rule}.`);
      this.set('showErrors', true);
      this.set('theRule', rule);
    }
  }
});
