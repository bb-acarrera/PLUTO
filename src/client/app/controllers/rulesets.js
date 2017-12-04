import Ember from 'ember';

function addRuleset(controller, rulesetId, ruleset) {
	if (rulesetId === "_run_") {
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

function runRuleset(controller, rulesetId) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = () => {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			try {
				var jsonResponse = JSON.parse(xmlHttp.responseText);

				if (jsonResponse.runId != null) {
					startPolling(controller, rulesetId, jsonResponse.runId);
				} else {
					alert('Error processing file: ' + jsonResponse.processing)
				}

				controller.get('target.router').refresh();
			}
			catch (e) {
				console.log("rulesetController.runRuleset() expected a JSON response.\n\t" + e);
			}
		}
		else if (xmlHttp.readyState == 4) {
			alert(`Failed to create: ${xmlHttp.statusText}`);
		}
	};

	let theUrl = document.location.origin + "/processFile/";
	let theJSON = {
		ruleset: rulesetId
	};

	xmlHttp.open("POST", theUrl, true); // true for asynchronous
	xmlHttp.setRequestHeader("Content-Type", "application/json");
	xmlHttp.send(JSON.stringify(theJSON));
}

function startPolling(controller, rulesetID, runID) {
	let pollId = controller.get('poll').addPoll({
		interval: 1000, // one second
		callback: () => {
			let tracker = controller.get('rulesetTrackerMap').get(rulesetID).get('run');
			var _runId = tracker.get('runID');	// Somehow the passed in runID is getting overwritten eventually.
			controller.store.findRecord('run', _runId).then(
				run => {
					if (!run.get('isrunning')) {
						tracker.set('processing', false);
						var pId = tracker.get('pollId');
						controller.get('poll').stopPoll(pId);

						tracker.set('details', run);

					}
				});
		}
	});

	let tracker = controller.get('rulesetTrackerMap').get(rulesetID);
	let run = Ember.Object.create({
		processing: true,
		runID: runID,
		pollId: pollId
	});
	tracker.set('run', run);

}

export default Ember.Controller.extend({
	queryParams: [
		"rulePage",
		"rulePerPage",
		"filenameFilter",
		"rulesetFilter",
		"showErrors",
		"rulesetNameFilter",
		"rulesetGroupFilter",
		"runGroupFilter",
		"run",
		"sourceGroupFilter",
		"sourceDescriptionFilter",
		"fileFilter"
	],
	applicationController: Ember.inject.controller('application'),

	// set default values, can cause problems if left out
	// if value matches default, it won't display in the URL
	rulePage: 1,
	rulePerPage: 10,
	rulesetFilter: '',
	filenameFilter: '',
	showErrors: true,
	rulesetNameFilter: '',
	rulesetGroupFilter: '',
	runGroupFilter: '',
	sourceGroupFilter: '',
	sourceDescriptionFilter: '',
	fileFilter: '',


	totalPages: Ember.computed.oneWay('model.runs.meta.totalPages'),
	totalRulePages: Ember.computed.oneWay('model.rulesets.meta.totalPages'),

	run: false,
	poll: Ember.inject.service(),


	rulesetFilterChanged: Ember.observer('rulesetNameFilter', 'rulesetGroupFilter', "sourceGroupFilter",
		"sourceDescriptionFilter",	"fileFilter",
		function () {
			this.set('rulePage', 1);
		}),

	userChanged: Ember.observer('applicationController.currentUser', function () {
		this.set('rulesetGroupFilter', this.get('applicationController.currentUser.group'));
	}),

	rulesets: Ember.computed('model.rulesets.result', function () {
		const rulesets = this.get('model.rulesets.result');

		const list = [];

		const rulesetTrackerMap = Ember.Map.create();
		const oldTrackerMap = this.get('rulesetTrackerMap');

		rulesets.forEach((ruleset) => {
			let run = null;

			if (oldTrackerMap) {
				const tracker = oldTrackerMap.get(ruleset.get('filename'));
				if (tracker) {
					run = tracker.get('run');
				}
			}

			let source = null;
			const sourceId = ruleset.get('source.filename');
			if(sourceId) {
				source = this.store.findRecord('configuredrule', sourceId);
			}

			const obj = Ember.Object.create({
				ruleset: ruleset,
				filename: ruleset.get('filename'),
				group: ruleset.get('group'),
				ownergroup: ruleset.get('ownergroup'),
				run: run,
				source: source
			});

			list.push(obj);
			rulesetTrackerMap.set(ruleset.get('filename'), obj);
		});

		this.set('rulesetTrackerMap', rulesetTrackerMap);

		return list;
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
		setShowAddRuleset(cloneRuleset) {
			this.set('cloneRuleset', cloneRuleset);

			const parsers = this.get('model.parsers');
			parsers.forEach((parser) => {
				if (parser.get('filename') == cloneRuleset.get('parser.filename')) {
					this.set('cloneParser', parser);
				}
			});

			const sourceId = cloneRuleset.get('source.filename');
			if(sourceId) {
				this.set('cloneSource', this.store.queryRecord('configuredrule', {id: sourceId}));
			}

			const targetId = cloneRuleset.get('target.filename');
			if(targetId) {
				this.set('cloneTarget', this.store.queryRecord('configuredrule', {id: targetId}));
			}


			this.set('showAddRuleset', true);
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
		},

		runRuleset(ruleset) {
			runRuleset(this, ruleset.get("ruleset_id"));
		},

		toggleRowHighlight (rowID) {

			const row = document.getElementById(rowID);

			const selected = row.classList.contains('selected');

			deselectItems();

			if (!selected) {
				row.classList.add('selected');
			}

		}
	},
	init: function () {
//		this.set('rulesetGroupFilter', this.get('applicationController.currentUser.group'));
//		this.set('runGroupFilter', this.get('applicationController.currentUser.group'));
	}
});

function deselectItems() {
	const rulesElem = document.getElementById('rulesetTable');

	const items = rulesElem.childNodes;
	for (var i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.nodeName.toLowerCase() == "tr" && item.classList)
			item.classList.remove('selected');
	}
}
