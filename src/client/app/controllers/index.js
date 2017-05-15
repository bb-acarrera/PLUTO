import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['file', 'ruleset', 'error'],
  file: null,
  ruleset: null,
  error: null
});
