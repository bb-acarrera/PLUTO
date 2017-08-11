import Ember from 'ember';

export default Ember.Route.extend({

  setupController: function (controller, model) {
    const store = this.get('store');

    getData(store, model, controller)


  }
});

function getData(store, model, controller) {
  return store.findRecord('run', model.id).then(
    (run) => {
      
      Ember.RSVP.Promise.all([
        store.findRecord('ruleset', run.get('ruleset')),
        store.findRecord('log', run.get('log')),
        store.findAll('rule')]).then(
        (values)=>{
          controller.set("model", {file: run.get('inputfilename'), ruleset: values[0], log: values[1], rules: values[2]});
        },
        error => {
          controller.set("model", {error: error});
        }
      );
    },
    error => {
      controller.set("model", {error: error});
    }
  );
}

