import Ember from 'ember';

export default Ember.Component.extend({
	actions: {
		addRuleset() {
			this.set("showdialog", false);
			addRuleset(this, this.modaltext);
		}
	}
});

function addRuleset(component, rulesetId, ruleset) {

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = () => {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
			component.get('target.router').refresh();
			component.transitionToRoute('editRuleset', rulesetId);
		}
		else if (xmlHttp.readyState == 4) {
			alert(`Failed to create: ${xmlHttp.statusText}`);
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
