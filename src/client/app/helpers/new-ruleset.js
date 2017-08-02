import Ember from 'ember';

// This is an alternative way to create a helper. It also demonstrates how to access the "store" in a helper.
export default Ember.Helper.extend({
  store: Ember.inject.service('store'),

  compute(/*params, hash*/) {
    let store = this.get('store');

    // Instead of createRecord() perhaps use XMLHTTPRequest to get a new ruleset and populate it from here.

    let newRuleset = store.createRecord('ruleset');
    newRuleset.set("id", "NEW");
    newRuleset.set("name", "Fred");

    return newRuleset;
  }
});
