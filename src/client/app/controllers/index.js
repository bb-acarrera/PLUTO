import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: [],
  actions: {
    addRuleset() {
      alert("Add ruleset not yet implemented.");
    },

    cloneRuleset() {
      alert("Clone ruleset not yet implemented.");
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
        }

        let theUrl = document.location.origin + "/rulesets/" + ruleset.id;
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
