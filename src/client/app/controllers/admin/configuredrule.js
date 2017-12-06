import Ember from 'ember';

function addRule(controller, rule) {

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = () => {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {

			let ruleId = '';

			try {
				let rule = JSON.parse(xmlHttp.response);
				ruleId = rule.rule_id;
			} catch (e) {
				console.log(e);
			}

			controller.get('target.router').refresh();
			if(ruleId) {
				controller.transitionToRoute('editConfiguredRule', ruleId);
			}

		}
		else if (xmlHttp.readyState == 4) {
			alert(`Failed to create: ${xmlHttp.statusText}`);
		}
	};

	let theUrl = document.location.origin + "/configuredrules/";
	let theJSON = {
		rule: rule
	};

	xmlHttp.open("POST", theUrl, true); // true for asynchronous
	xmlHttp.setRequestHeader("Content-Type", "application/json");
	xmlHttp.send(JSON.stringify(theJSON));
}

export default Ember.Controller.extend({
	queryParams: ["page",
		"perPage",
		"ruleFilter",
		"groupFilter",
		"typeFilter",
		"ownerFilter",
		"ruleDescriptionFilter"
	],
	page: 1,
	perPage: 20,
	ruleFilter: '',
	groupFilter: '',
	ownerFilter: '',
	typeFilter: '',
	ruleDescriptionFilter: '',
	totalPages: Ember.computed.oneWay('model.rules.meta.totalPages'),

	applicationController: Ember.inject.controller('application'),

	ptarget: "default",
	showdialog: false,
	dialogtarget: "",
	buttontext: "Save",
	isclone: false,
	dialogrule: null,

	title: Ember.computed('model.rules', function() {
		const type = this.get('typeFilter');
		let title = '';

		if(type == 'source') {
			title = 'Sources';
		} else if(type == 'target') {
			title = 'Targets'
		}

		return title;

	}),

	filterChanged: Ember.observer('ruleFilter', 'ruleGroupFilter', 'typeFilter',
		function() {
			this.set('page', 1);
		}),

	actions: {
		decPage() {
			this.transitionToRoute({queryParams: {page: Math.max(this.page - 1, 1)}});
		},
		incPage() {
			this.transitionToRoute({queryParams: {page: Math.min(this.page + 1, this.get('totalPages'))}});
		},
		openNewDialog(){
			this.set("ptarget", "New " + this.get('typeFilter'));
			this.set("dialogtarget", "");
			this.set("buttontext", "Save");
			this.set("showdialog", true);
			this.set("isclone", false);
			this.set("dialogrule", null);
			this.set("modaltext", "");
		},
		addRule() {
			this.set("showdialog", false);
			addRule(this,
				{
					type: this.get('typeFilter'),
					description: this.modaltext,
					config: {}
				}
			);
		},
		cloneRule() {

		},

		deleteRule(rule, rules) {
			if (confirm(`Delete "${rule.get("description")}"?`)) {
				var xmlHttp = new XMLHttpRequest();
				xmlHttp.onreadystatechange = () => {
					if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
						rules.removeObject(rule);
						rules.notifyPropertyChange("length");
						this.get('target.router').refresh();
					}
					else if (xmlHttp.readyState == 4) {
						alert(`Failed to delete: ${xmlHttp.statusText}`);
					}
				};

				let theUrl = document.location.origin + "/configuredrules/" + rule.id;  // This 'id' should be the same as the 'ruleset_id'.
				let theJSON = rule.toJSON();
				theJSON.id = rule.id;

				xmlHttp.open("DELETE", theUrl, true); // true for asynchronous
				xmlHttp.setRequestHeader("Content-Type", "application/json");
				xmlHttp.send(JSON.stringify(theJSON));
			}
		}
	},
	init: function() {

	}
});
