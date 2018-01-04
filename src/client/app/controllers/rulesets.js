import Ember from 'ember';

const apiBase = document.location.origin + '/api/v1';

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

	let theUrl = apiBase + "/rulesets/";
	let theJSON = {
		rulesetId: rulesetId,
		ruleset: ruleset
	};

	xmlHttp.open("POST", theUrl, true); // true for asynchronous
	xmlHttp.setRequestHeader("Content-Type", "application/json");
	xmlHttp.send(JSON.stringify(theJSON));
}

function runFailedToStart(controller, rulesetID) {
	let run = controller.get('rulesetTrackerMap').get(rulesetID).get('run');
	run.set('processing', false);
	run.set('failedToStart', true);

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
					alert('Error processing file: ' + jsonResponse.processing);
					runFailedToStart(controller, rulesetId);
				}

				controller.get('target.router').refresh();
			}
			catch (e) {
				console.log("rulesetController.runRuleset() expected a JSON response.\n\t" + e);
				runFailedToStart(controller, rulesetId);
			}
		}
		else if (xmlHttp.readyState == 4) {
			alert(`Failed to create: ${xmlHttp.statusText}`);
			runFailedToStart(controller, rulesetId);
		}
	};

	let theUrl = apiBase + "/processFile/";
	let theJSON = {
		ruleset: rulesetId
	};

	xmlHttp.open("POST", theUrl, true); // true for asynchronous
	xmlHttp.setRequestHeader("Content-Type", "application/json");
	xmlHttp.send(JSON.stringify(theJSON));

	let tracker = controller.get('rulesetTrackerMap').get(rulesetId);
	let run = Ember.Object.create({
		processing: true
	});
	tracker.set('run', run);
}

function startPolling(controller, rulesetID, runID) {
	let pollId = controller.get('poll').addPoll({
		interval: 1000, // one second
		callback: () => {
			let run = controller.get('rulesetTrackerMap').get(rulesetID).get('run');
			var _runId = run.get('runID');	// Somehow the passed in runID is getting overwritten eventually.
			controller.store.findRecord('run', _runId).then(
				runDetails => {
					if (!runDetails.get('isrunning')) {
						run.set('processing', false);
						var pId = run.get('pollId');
						controller.get('poll').stopPoll(pId);

						run.set('details', runDetails);

					} else {
						run.set('processing', true);
					}
				});
		}
	});

	let tracker = controller.get('rulesetTrackerMap').get(rulesetID);
	let run = tracker.get('run');

	run.set('runID', runID);
	run.set('pollId', pollId);

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
		"sourceDescriptionFilter",
		"fileFilter"
	],
	applicationController: Ember.inject.controller('application'),

	// set default values, can cause problems if left out
	// if value matches default, it won't display in the URL
	rulePage: 1,
	rulePerPage: 20,
	rulesetFilter: '',
	filenameFilter: '',
	showErrors: true,
	rulesetNameFilter: '',
	rulesetGroupFilter: '',
	runGroupFilter: '',
	sourceDescriptionFilter: '',
	fileFilter: '',

	totalPages: Ember.computed.oneWay('model.runs.meta.totalPages'),
	totalRulePages: Ember.computed.oneWay('model.rulesets.meta.totalPages'),

	poll: Ember.inject.service(),

	rulesetTrackerMap: Ember.Map.create(),


	rulesetFilterChanged: Ember.observer('rulesetNameFilter', 'rulesetGroupFilter',
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

		const rulesetTrackerMap  = this.get('rulesetTrackerMap');

		rulesets.forEach((ruleset) => {
			let run = null;


			const tracker = rulesetTrackerMap.get(ruleset.get('filename'));
			if (tracker) {
				run = tracker.get('run');
			}


			let source = null;
			const sourceId = ruleset.get('source.filename');
			if(sourceId) {
				source = this.store.findRecord('configuredrule', sourceId);
			}

			const obj = Ember.Object.create({
				ruleset: ruleset,
				filename: ruleset.get('filename'),
				ownergroup: ruleset.get('ownergroup'),
				run: run,
				source: source
			});

			list.push(obj);
			rulesetTrackerMap.set(ruleset.get('filename'), obj);
		});

		return list;
	}),

	rulesetRunLoad: Ember.observer('model.rulesets.result.@each.run', function() {
		const rulesetTrackerMap  = this.get('rulesetTrackerMap');
		const rulesets = this.get('model.rulesets.result');

		rulesets.forEach((ruleset) => {
			const tracker = rulesetTrackerMap.get(ruleset.get('filename'));
			if (tracker) {
				let currRun = tracker.get('run');
				let runDetails = ruleset.get('run');


				if(currRun && runDetails && currRun.get('runID') >= runDetails.get('id')) {
					runDetails = null;
				}

				if(runDetails) {
					let run = new Ember.Object({
						runID: runDetails.get('id')
					});

					tracker.set('run', run);

					if(runDetails.get('isrunning')) {
						startPolling(this, ruleset.get('ruleset_id'), runDetails.get('id'))
					} else {
						run.set('details', runDetails);
					}

				}
			}
		});

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

			if(cloneRuleset) {
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

				let theUrl = apiBase + "/rulesets/" + ruleset.id;  // This 'id' should be the same as the 'ruleset_id'.
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
		this.set('rulesetGroupFilter', this.get('applicationController.currentUser.group'));
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
