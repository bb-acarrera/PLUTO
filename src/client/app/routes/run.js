import Ember from 'ember';

export default Ember.Route.extend({

  setupController: function (controller, model) {
    const store = this.get('store');

    getData(store, model, controller)


  }
});

function getData(store, model, controller) {
  return store.findRecord('run', model.id).then(
    run => {
      //return run;
      return store.findRecord('ruleset', run.get('ruleset')).then(
        ruleSetResult => {
          return store.findRecord('log', run.get('log')).then(
            logResult => {
              // Get the rule files for displaying in a choice selector. (These are not the rule instances in a ruleset.)
              return store.findAll('rule').then(
                rules => {
                  controller.set("model", {file: run.get('inputfilename'), ruleset: ruleSetResult, log: logResult, rules: rules});
                },
                error => {
                  controller.set("model", {file: run.get('inputfilename'), ruleset: ruleSetResult, log: logResult, rules: null, error: error});
                }
              )
            },
            error => {
              controller.set("model", {file: run.get('inputfilename'), ruleset: ruleSetResult, log: null, rules: null, error: error});
            });
        },
        error => {
          controller.set("model", {file: run.get('inputfilename'), ruleset: null, log: null, rules: null, error: error});
        });
    },
    error => {
      controller.set("model", {error: error});
    }
  );
}
