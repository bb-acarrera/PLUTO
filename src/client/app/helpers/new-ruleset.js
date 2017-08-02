import Ember from 'ember';

// This is an alternative way to create a helper. It also demonstrates how to access the "store" in a helper.
export default Ember.Helper.extend({
  store: Ember.inject.service('store'),

  compute(/*params, hash*/) {
    let store = this.get('store');
    let newRuleset = store.createRecord('ruleset');
    newRuleset.set("id", "NEW");
    newRuleset.set("name", "Fred");

    return newRuleset;
  }
});
