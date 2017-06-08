import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['file', 'ruleset', 'log'],
  file: null,
  ruleset: null,
  log: null,
  actions: {
    showErrors(rule) {
      this.set('showErrors', rule);
    },
    saveRuleSet(ruleset) {
      save(ruleset);
    },
    addRule() {
      
    }
  }
});

function save(ruleset) {
  var name = document.getElementById("rulesetName").value;
  ruleset.set("name", name);
  ruleset.save().then(() => {
    alert("Successfully saved.");
  }, () => {
    alert("Failed to save.");
  });
}
