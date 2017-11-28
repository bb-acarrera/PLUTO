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
	page: 1,
	perPage: 10,
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

	totalPages: Ember.computed.oneWay('model.runs.meta.totalPages'),
	totalRulePages: Ember.computed.oneWay('model.rulesets.meta.totalPages'),

	runFilterChanged: Ember.observer('showErrors', 'showDropped', 'showWarnings', 'showNone', 'rulesetFilter',
		'filenameFilter', 'dateFilter', 'runGroupFilter', 'showPassed', 'showFailed',
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
			let page = this.get('page');

			this.set('page', Math.max(page - 1, 1));
		},
		incPage() {
			let page = this.get('page');

			this.set('page', Math.min(page + 1, this.get('totalPages')));
		},


        toggleRowHighlight ( rowID ) {

            const row = document.getElementById( rowID );

            const selected = row.classList.contains( 'selected' );

            deselectItems( );

            if ( !selected ) {
                row.classList.add( 'selected' );
            }

        }
	},
	init: function() {
		this.set('rulesetGroupFilter', this.get('applicationController.currentUser.group'));
		this.set('runGroupFilter', this.get('applicationController.currentUser.group'));
	}
});

function deselectItems ( ) {
    const rulesElem = document.getElementById( 'runsTable' );

    const items = rulesElem.childNodes;
    for ( var i = 0; i < items.length; i++ ) {
        const item = items[ i ];
        if ( item.nodeName.toLowerCase() == "tr" && item.classList )
            item.classList.remove( 'selected' );
    }
}