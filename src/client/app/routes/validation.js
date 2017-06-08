import Ember from 'ember';

export default Ember.Route.extend({
  model(params) {
    const store = this.get('store');
    
    if (params && params.ruleset && params.log && params.file) {
      return store.findRecord('ruleset', params.ruleset).then(
        ruleSetResult => {
          return store.findRecord('log', params.log).then(
            logResult => {
              return store.findAll('rule').then(
                rules => {
                  return {file: params.file, ruleset: ruleSetResult, log: logResult, rules: rules};
                },
                error => {
                  return {file: params.file, ruleset: ruleSetResult, log: logResult, rules: null, error: error};
                }
              )
            },
            error => {
              return {file: params.file, ruleset: ruleSetResult, log: null, rules: null, error: error};
            });
        },
        error => {
          return {file: params.file, ruleset: null, log: null, rules: null, error: error};
        });
    }
    else {
        // TODO: Display an error? (No params so can't make a request of the server.)
        return { file : null, ruleset : null, log : null, rules: null, error: "Bad request." };  // TODO: Improve this error response.
      }
  }
});
