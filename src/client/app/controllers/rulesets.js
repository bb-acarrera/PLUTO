import Ember from 'ember';

function addRuleset(controller, rulesetId, ruleset) {
	if(rulesetId === "_run_") {
		alert(`_run_ is a reserved name. Please choose a different one.`);
		return;
	}

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = () => {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
			controller.get('target.router').refresh();
			controller.transitionToRoute('editRuleset', rulesetId);
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

export default Ember.Controller.extend({
	queryParams: [
//		"page",
//		"perPage",
		"rulePage",
		"rulePerPage",
		"filenameFilter",
		"rulesetFilter",
		"showErrors",
//		"showWarnings",
//		"showNone",
//		"dateFilter",
		"rulesetNameFilter",
		"rulesetGroupFilter",
		"runGroupFilter"
	],
	ptarget: "default",
	showdialog: false,
	dialogtarget: "",
	buttontext: "Save",
	isclone: false,
	dialogruleset: null,
	applicationController: Ember.inject.controller('application'),

	// set default values, can cause problems if left out
	// if value matches default, it won't display in the URL
//	page: 1,
//	perPage: 10,
	rulePage: 1,
	rulePerPage: 10,
	rulesetFilter: '',
	filenameFilter: '',
	showErrors: true,
//	showWarnings: true,
//	showNone: true,
//	dateFilter: '',
	rulesetNameFilter: '',
	rulesetGroupFilter: '',
	runGroupFilter: '',

	totalPages: Ember.computed.oneWay('model.runs.meta.totalPages'),
	totalRulePages: Ember.computed.oneWay('model.rulesets.meta.totalPages'),

	runFilterChanged: Ember.observer('showErrors', 'showWarnings', 'showNone', 'rulesetFilter',
		'filenameFilter', 'dateFilter', 'runGroupFilter',
		function() {
			this.set('page', 1);
		}),

	rulesetFilterChanged: Ember.observer('rulesetNameFilter', 'rulesetGroupFilter',
		function() {
			this.set('rulePage', 1);
		}),

	userChanged: Ember.observer('applicationController.currentUser', function() {
		this.set('rulesetGroupFilter', this.get('applicationController.currentUser.group'));
		this.set('runGroupFilter', this.get('applicationController.currentUser.group'));
	}),

	actions: {
		decPage() {
			this.transitionToRoute({queryParams: {page: Math.max(this.page - 1, 1)}});
		},
		incPage() {
			this.transitionToRoute({queryParams: {page: Math.min(this.page + 1, this.get('totalPages'))}});
		},
		decRulePage() {
			this.transitionToRoute({queryParams: {rulePage: Math.max(this.rulePage - 1, 1)}});
		},
		incRulePage() {
			this.transitionToRoute({queryParams: {rulePage: Math.min(this.rulePage + 1, this.get('totalRulePages'))}});
		},
		openNewDialog(){
			this.set("ptarget", "Name the new ruleset");
			this.set("dialogtarget", "");
			this.set("buttontext", "Save");
			this.set("showdialog", true);
			this.set("isclone", false);
			this.set("dialogruleset", null);
			this.set("modaltext", "");
		},
		openCloneDialog(cloneName, ruleset){
			this.set("ptarget", "Please name the clone of ");
			this.set("dialogtarget", cloneName);
			this.set("buttontext", "Clone");
			this.set("showdialog", true);
			this.set("isclone", true);
			this.set("dialogruleset", ruleset);
			this.set("modaltext", "");

		},
		addRuleset() {
			this.set("showdialog", false);
			addRuleset(this, this.modaltext);
		},

		cloneRuleset(ruleset) {
			this.set("showdialog", false);
			var rulesetId = this.modaltext;

			var rulesetCopy = ruleset.toJSON().rules;
			rulesetCopy.name = "Copy of " + rulesetCopy.name;

			addRuleset(this, rulesetId, rulesetCopy);
		},

		deleteRuleset(ruleset, rulesets) {
			if (confirm(`Delete "${ruleset.get("filename")}"?`)) {
				var xmlHttp = new XMLHttpRequest();
				xmlHttp.onreadystatechange = () => {
					if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
						rulesets.removeObject(ruleset);
						rulesets.notifyPropertyChange("length");
						this.get('target.router').refresh();
					}
					else if (xmlHttp.readyState == 4) {
						alert(`Failed to delete: ${xmlHttp.statusText}`);
					}
				};

				let theUrl = document.location.origin + "/rulesets/" + ruleset.id;  // This 'id' should be the same as the 'ruleset_id'.
				let theJSON = ruleset.toJSON();
				theJSON.id = ruleset.id;

				xmlHttp.open("DELETE", theUrl, true); // true for asynchronous
				xmlHttp.setRequestHeader("Content-Type", "application/json");
				xmlHttp.send(JSON.stringify(theJSON));
			}
		}
	},
	init: function() {
//		this.set('rulesetGroupFilter', this.get('applicationController.currentUser.group'));
//		this.set('runGroupFilter', this.get('applicationController.currentUser.group'));
	}
});
