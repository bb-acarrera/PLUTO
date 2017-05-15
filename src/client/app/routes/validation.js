import Ember from 'ember';

export default Ember.Route.extend({
  model(params) {
    if (params && params.ruleset && params.log && params.file) {
      return this.get('store').findRecord('ruleset', params.ruleset).then(ruleSetResult => {
        return this.get('store').findRecord('log', params.log).then(logResult => {
          return {file: params.file, ruleset: ruleSetResult, log: logResult};
        }, error => {
          return {file: params.file, ruleset: ruleSetResult, log: null, error: error};
        });
      }, error => {
        return {file: params.file, ruleset: null, log: null, error: error};
      });
      // return result;
    }
    else {
        // TODO: Display an error? (No params so can't make a request of the server.)
        return { file : null, ruleset : null, log : null };
      }
  }
});
