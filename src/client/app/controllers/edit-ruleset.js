import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
  ruleToEditChanged: Ember.observer('ruleToEdit', function()  {
    let val = this.get('ruleToEdit');
    let oldval = this.get('_oldRuleToEdit');

    if (val === oldval) { return; }

    this.set('_oldRuleToEdit', val);

    if (oldval) {
      updateRule(oldval, this.model.rules, this.model.ruleset, this.model.parsers);
    }
  }),
  ruleToEdit: null,
  actions: {
    saveRuleSet(ruleset) {
      updateRule(this.get('ruleToEdit'), this.model.rules, this.model.ruleset, this.model.parsers);
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

    updateRule(ruleInstance) {
      updateRule(ruleInstance, this.model.rules, this.model.ruleset, this.model.parsers);
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

      const selected = row.classList.contains('selected');

      deselectItems(selected, this);

      if(!selected) {
        row.classList.add('selected');

        this.set('ruleToEdit', rule);
      }

    },

    showChangeParser() {
      this.set('showChangeParser', true);
    },

    hideChangeParser() {
      this.set('showChangeParser', false);
    },

    changeParser(ruleset, parsers) {

      changeParser(ruleset, parsers);

      this.set('showChangeParser', false);
    },

    stopPropagation(event) {
      event.stopPropagation();
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

      var uiConfig = rule.get('ui').properties;
      var startingConfig = {};
      uiConfig.forEach(config => {
        if(config.default) {
          startingConfig[config.name] = config.default;
        }
      });

      newRule.config = Object.assign({}, rule.get("config") || startingConfig);  // Clone the config. Don't want to reference the original.
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

function updateRule(ruleInstance, rules, ruleset, parsers) {
  if (!ruleInstance)
    return;

  // Update the name.
  if (ruleInstance.hasOwnProperty("name")) {
    const value = document.getElementById('name').value;
    Ember.set(ruleInstance, 'name', value);
  }

  var uiConfig;
  rules.forEach(rule => {
    if (rule.get("filename") == ruleInstance.filename)
      uiConfig = rule.get("ui");
  });

  if(!uiConfig) {
    parsers.forEach(parser => {
      if (parser.get("filename") == ruleInstance.filename)
        uiConfig = parser.get("ui");
    });
  }

  // Get the properties.
  uiConfig.properties.forEach(prop => {
      let element = document.getElementById(prop.name);
      if (element) {
        var value = prop.type === 'boolean' ? element.checked : element.value;
        if(prop.type === "list") {
          var re = /\s*,\s*/;
          value = value.split(re);
        }
        if(prop.type === "column") {
          value = $(element).prop('selectedIndex');
        }

        Ember.set(ruleInstance.config, prop.name, value);
      }
    }
  );

  ruleset.notifyPropertyChange("rules");
}

function createGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  })
}

function deselectItems(clearProperties, controller) {
  const rulesElem = document.getElementById('rulesTable');

  const items = rulesElem.childNodes;
  for (var i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.nodeName.toLowerCase() == "tr" && item.classList)
      item.classList.remove('selected');
  }

  const parserElem = document.getElementById('parser');
  parserElem.classList.remove('selected');

  if(clearProperties) {
    controller.set('ruleToEdit', null);
    controller.set('showErrors', null);
  }

}

function changeParser(ruleset, parsers) {
  const newParserFilename = document.getElementById("selectParser").value;
  if (newParserFilename == "None") {
    ruleset.set("parser", null);
    ruleset.notifyPropertyChange("parser");
  } else {
    parsers.forEach(parser => {
      if (parser.get("filename") == newParserFilename) {
        const newParser = {};
        newParser.filename = parser.get("filename");

        var uiConfig = parser.get("ui").properties;
        var startingConfig = {};
        uiConfig.forEach(config => {
          if(config.default) {
            startingConfig[config.name] = config.default;
          }
        });
        newParser.config = Object.assign({}, parser.get("config") || startingConfig);  // Clone the config. Don't want to reference the original.
        newParser.name = newParser.filename;
        newParser.config.id = createGUID();

        ruleset.set("parser", newParser);
        ruleset.notifyPropertyChange("parser");
      }
    });
  }



}


