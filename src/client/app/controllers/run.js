import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
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
    },

    deleteRule(tableID, ruleset) {
      deleteRule(tableID, ruleset);
    },
    editRule(rule) {
      this.set('ruleToEdit', rule);
    },

    updateRule(ruleset, rule) {
      updateRule(ruleset, rule);
    },

    moveRuleUp(ruleset, index) {
      if (index < 1)
        return;

      const rules = ruleset.get('rules');
      const movingRule = rules[index];

      rules.splice(index, 1); // Remove the rule.
      rules.splice(index-1, 0, movingRule); // Add it back one spot earlier.
      ruleset.notifyPropertyChange("rules");
    },

    moveRuleDown(ruleset, index) {
      const rules = ruleset.get('rules');
      if (index >= rules.length)
        return;

      const movingRule = rules[index];

      rules.splice(index, 1); // Remove the rule.
      rules.splice(index+1, 0, movingRule); // Add it back one spot later.
      ruleset.notifyPropertyChange("rules");
    },

    toggleRowHighlight(rowID, rule) {
      const row = document.getElementById(rowID);

      var siblings = row.parentNode.childNodes;
      for (var i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling.nodeName.toLowerCase() == "tr" && sibling.classList)
          sibling.classList.remove('selected');
      }

      row.classList.add('selected');

      this.set('showErrors', rule);
    }
  },
  init: function() {
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
      newRule.id = createGUID();
      newRule.config = Object.assign({}, rule.get("config") || {});  // Clone the config. Don't want to reference the original.
      newRule.config.Name = newRule.filename;

      ruleset.get("rules").push(newRule);
      ruleset.notifyPropertyChange("rules");
    }
  });
}

function deleteRule(tableID, ruleset) {
  const table = document.getElementById(tableID);
  var siblings = table.childNodes;
  var ruleToDelete = -1;
  var row = 0;
  for (var i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling.nodeName.toLowerCase() == "tr" && sibling.classList) {
      if (sibling.classList.contains("selected")) {
        ruleToDelete = row;
        break;
      }
      row++;
    }
  }

  if (ruleToDelete < 0) {
    alert("No rule selected. Nothing to delete.");
    return;
  }

  const rules = ruleset.get('rules');
  const rule = rules[ruleToDelete];
  if (confirm(`Delete rule "${rule.config.Name}"?`)) {
    rules.splice(ruleToDelete, 1); // Remove the rule.
    ruleset.notifyPropertyChange("rules");
  }
}

function updateRule(ruleset, rule) {
  if (!rule)
    return;

  // Get the initial name.
  // if (!rule.config.hasOwnProperty("name")) {
  //   const value = document.getElementById('name').value;
  //   rule.config['name'] = value;
  // }

  // Get the properties.
  for (var key in rule.config) {
    const value = document.getElementById(key).value;
    Ember.set(rule.config, key, value);
  }

  ruleset.notifyPropertyChange("rules");
}

function createGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  })
}

