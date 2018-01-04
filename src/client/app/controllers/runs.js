import Ember from 'ember';



export default Ember.Controller.extend({
	queryParams: ["page",
		"perPage",
		"filenameFilter",
		"rulesetFilter",
		"showErrors",
		"showDropped",
		"showWarnings",
		"showNone",
		"showPassed",
		"showFailed",
		"dateFilter",
		"runGroupFilter",
		"sourceFilter",
		"sourceFileFilter"

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
	page: 1,
	perPage: 20,
	rulesetFilter: '',
	filenameFilter: '',
	showErrors: true,
	showDropped: true,
	showWarnings: true,
	showNone: true,
	showPassed: true,
	showFailed: true,
	dateFilter: '',
	rulesetNameFilter: '',
	rulesetGroupFilter: '',
	runGroupFilter: '',
	sourceFileFilter: '',
	sourceFilter: '',

	totalPages: Ember.computed.oneWay('model.runs.meta.totalPages'),
	totalRulePages: Ember.computed.oneWay('model.rulesets.meta.totalPages'),

	runFilterChanged: Ember.observer('showErrors', 'showDropped', 'showWarnings', 'showNone', 'rulesetFilter',
		'filenameFilter', 'dateFilter', 'runGroupFilter', 'showPassed', 'showFailed',
		function() {
			this.set('page', 1);
		}),


	userChanged: Ember.observer('applicationController.currentUser', function() {
		this.set('runGroupFilter', this.get('applicationController.currentUser.group'));
	}),

	runs: Ember.computed('model.runs.result', function () {
		const runs = this.get('model.runs.result');

		const list = [];


		runs.forEach((run) => {

			let source = null;
			const sourceId = run.get('sourceid');
			if(sourceId) {
				source = this.store.findRecord('configuredrule', sourceId);
			}

			const obj = Ember.Object.create({
				run: run,
				source: source
			});

			list.push(obj);
		});



		return list;
	}),

	actions: {
		decPage() {
			let page = this.get('page');

			this.set('page', Math.max(page - 1, 1));
		},
		incPage() {
			let page = this.get('page');

			this.set('page', Math.min(page + 1, this.get('totalPages')));
		},

		goToRun(runId) {
			this.transitionToRoute('run', runId);
		}

	},
	init: function() {
		this.set('runGroupFilter', this.get('applicationController.currentUser.group'));
	}
});


