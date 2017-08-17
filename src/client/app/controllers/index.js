import Ember from 'ember';


function addRuleset(controller, rulesetId, ruleset) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = () => {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
      controller.get('target.router').refresh();
      controller.transitionToRoute('editRuleset', rulesetId);
    }
    else if (xmlHttp.readyState == 4) {
      alert(`Failed to create. Status = ${xmlHttp.status}`);
    }
  };

  let theUrl = document.location.origin + "/rulesets/";
  let theJSON = {
    rulesetId: rulesetId,
    ruleset: ruleset
  };

  xmlHttp.open("POST", theUrl, true); // true for asynchronous
  xmlHttp.setRequestHeader("Content-Type", "application/json");
  xmlHttp.send(JSON.stringify(theJSON));
}

export default Ember.Controller.extend({
  queryParams: [],
  actions: {
    addRuleset() {
      var rulesetId = prompt("Enter a name for the new ruleset", "");

      addRuleset(this, rulesetId);
    },

    cloneRuleset(ruleset) {
      var rulesetId = prompt("Enter a name for the copied ruleset", "");

      var rulesetCopy = ruleset.toJSON().rules;
      ruleset.name = "Copy of " + ruleset.name;

      addRuleset(this, rulesetId, rulesetCopy);
    },

    deleteRuleset(ruleset, rulesets) {
      if (confirm(`Delete "${ruleset.get("name") || ruleset.get("filename")}"?`)) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            rulesets.removeObject(ruleset);
            rulesets.notifyPropertyChange("length");
          }
          else if (xmlHttp.readyState == 4) {
            alert(`Failed to delete. Status = ${xmlHttp.status}`);
          }
        };

        let theUrl = document.location.origin + "/rulesets/" + ruleset.id;  // This 'id' should be the same as the 'ruleset_id'.
        let theJSON = ruleset.toJSON();
        theJSON.id = ruleset.id;

        xmlHttp.open("DELETE", theUrl, true); // true for asynchronous
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.send(JSON.stringify(theJSON));
      }
    },

    editRuleset() {
      alert("Edit ruleset not yet implemented.");
    }
  },
  init: function() {
  }
});
