import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
  actions: {
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

      this.set('ruleToEdit', rule);
      this.set('showErrors', rule);
    }
  },
  init: function() {
  }
});

function save(ruleset) {
  var name = document.getElementById("rulesetName").value;
  ruleset.set("name", name);

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      alert("Successfully saved.");
    }
    else if (xmlHttp.readyState == 4) {
      alert(`Failed to save. Status = ${xmlHttp.status}`);
    }
  }

  let theUrl = document.location.origin + "/rulesets/" + ruleset.id;
  let theJSON = ruleset.toJSON();
  // theJSON.id = ruleset.id;

  xmlHttp.open("PATCH", theUrl, true); // true for asynchronous
  xmlHttp.setRequestHeader("Content-Type", "application/json");
  xmlHttp.send(JSON.stringify(theJSON));

  // ruleset.save().then(() => {
  //   alert("Successfully saved.");
  // }, () => {
  //   alert("Failed to save.");
  // });
}

function addRule(ruleset, rules) {
  const newRuleFilename = document.getElementById("selectRule").value;
  if (newRuleFilename == "None")
    return;

  rules.forEach(rule => {
    if (rule.get("filename") == newRuleFilename) {
      const newRule = {};
      newRule.filename = rule.get("filename");
      newRule.config = Object.assign({}, rule.get("config") || {});  // Clone the config. Don't want to reference the original.
      newRule.name = newRule.filename;
      newRule.config.id = createGUID();

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
  if (confirm(`Delete rule "${rule.name}"?`)) {
    rules.splice(ruleToDelete, 1); // Remove the rule.
    ruleset.notifyPropertyChange("rules");
  }
}

function updateRule(ruleset, rule) {
  if (!rule)
    return;

  // Update the name.
  if (rule.hasOwnProperty("name")) {
    const value = document.getElementById('name').value;
    Ember.set(rule, 'name', value);
  }

  // Get the properties.
  for (var key in rule.config) {
    let element = document.getElementById(key);
    if (element) {
      const value = element.value;
      Ember.set(rule.config, key, value);
    }
  }

  ruleset.notifyPropertyChange("rules");
}

function createGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  })
}


