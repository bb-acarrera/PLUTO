import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel() {
    //this.replaceWith('validation');
    //this.replaceWith('run');
  },

  model() {
    const store = this.get('store');

    return store.findAll('run').then(
      run => {
        return run;
      },
      error => {
        return {error: error};
      }
    );

  }

});
