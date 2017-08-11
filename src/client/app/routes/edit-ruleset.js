import Ember from 'ember';

export default Ember.Route.extend({

  setupController: function (controller, model) {
    const store = this.get('store');

    getData(store, model, controller)


  }
});

function getData(store, model, controller) {

  Ember.RSVP.Promise.all([store.findRecord('ruleset', model.id), store.findAll('rule'), store.findAll('parser')]).then(
    (values)=>{
      controller.set("model", {ruleset: values[0], rules: values[1], parsers: values[2]});
    },
    error => {
      controller.set("model", {ruleset: null, rules: null, parsers:null, error: error});
    }
  );

}
