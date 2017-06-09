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
    showAddRule() {
      this.set('showAddRule', true);
    },
    hideAddRule() {
      this.set('showAddRule', false);
    },
    addRule(ruleset, rules) {
      addRule(ruleset, rules);
      this.set('showAddRule', false);
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

function addRule(ruleset, rules) {
  const newRuleFilename = document.getElementById("selectRule").value;
  if (newRuleFilename == "None")
    return;

  rules.forEach(rule => {
    if (rule.get("filename") == newRuleFilename) {
      const newRule = {};
      newRule.filename = rule.get("filename");
      newRule.name = rule.get("name");
      // newRule.id = rule.get("id");  // ID's should be unique.
      newRule.config = rule.get("config");

      ruleset.get("rules").push(newRule);
      ruleset.notifyPropertyChange("rules");
    }
  });
}
