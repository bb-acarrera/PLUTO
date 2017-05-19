import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['file', 'ruleset', 'log'],
  file: null,
  ruleset: null,
  log: null,
  actions: {
    showErrors(rule) {
      this.set('showErrors', rule);
    }
  }
});
