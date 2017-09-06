import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel() {
    //this.replaceWith('validation');
    //this.replaceWith('run');
  },

  model() {
    return this.store.findAll('run').then(
      runs => {
        return this.store.findAll('ruleset').then(
          rulesets => {
            return { runs : runs, rulesets : rulesets };
          },
          error => {
            return { runs : runs, error : error };
          }
        );
      },
      error => {
        return {error: error};
      }
    );

  }

});
