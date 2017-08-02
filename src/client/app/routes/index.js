import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel() {
    //this.replaceWith('validation');
    //this.replaceWith('run');
  },

  model() {
    return this.store.findAll('run');
  }

});
