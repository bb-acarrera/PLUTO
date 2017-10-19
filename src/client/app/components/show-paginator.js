import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    previous(){
      this.get('dec')();
    },
    next(){
      this.get('inc')();
    }
  }
});
