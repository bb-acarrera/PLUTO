import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
  actions: {
    addRuleset() {
      var rulesetId = prompt("Enter a name for the new ruleset", "");

      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
          this.transitionToRoute('editRuleset', rulesetId);
        }
        else if (xmlHttp.readyState == 4) {
          alert(`Failed to create. Status = ${xmlHttp.status}`);
        }
      };

      let theUrl = document.location.origin + "/rulesets/";
      let theJSON = {
        rulesetId: rulesetId
      };

      xmlHttp.open("POST", theUrl, true); // true for asynchronous
      xmlHttp.setRequestHeader("Content-Type", "application/json");
      xmlHttp.send(JSON.stringify(theJSON));

    },

    cloneRuleset(ruleset) {
      var rulesetId = prompt("Enter a name for the copied ruleset", "");

      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
          this.get('target.router').refresh();
          this.transitionToRoute('editRuleset', rulesetId);
        }
        else if (xmlHttp.readyState == 4) {
          alert(`Failed to create. Status = ${xmlHttp.status}`);
        }
      };

      var ruleset = ruleset.toJSON().rules;
      ruleset.name = "Copy of " + ruleset.name;

      let theUrl = document.location.origin + "/rulesets/";
      let theJSON = {
        rulesetId: rulesetId,
        ruleset: ruleset
      };

      xmlHttp.open("POST", theUrl, true); // true for asynchronous
      xmlHttp.setRequestHeader("Content-Type", "application/json");
      xmlHttp.send(JSON.stringify(theJSON));
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
