import Ember from 'ember';

const apiBase = document.location.origin + '/api/v1';

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

	let theUrl = apiBase + "/configuredrules/";
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
		"typeFilter",
		"ownerFilter",
		"ruleDescriptionFilter"
	],
	page: 1,
	perPage: 20,
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
			title = 'Download Locations';
		} else if(type == 'target') {
			title = 'Upload Locations'
		}

		return title;

	}),

	typeTitle: Ember.computed('model.rules', function() {
		const type = this.get('typeFilter');
		let title = '';

		if(type == 'source') {
			title = 'Download Location';
		} else if(type == 'target') {
			title = 'Upload Location'
		}

		return title;

	}),

	bases: Ember.computed('model.rules', function() {
		const type = this.get('typeFilter');
		let bases;

		if(type == 'source') {
			bases = this.get('model.importers');
		} else if(type == 'target') {
			bases = this.get('model.exporters');
		}

		return bases;

	}),

	filterChanged: Ember.observer('ruleDescriptionFilter', 'typeFilter',
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

			const type = this.get('typeFilter');
			let title = '';

			if(type == 'source') {
				title = 'Download Location';
			} else if(type == 'target') {
				title = 'Upload Location'
			}

			this.set("ptarget", "New " + title);
			this.set("dialogtarget", "");
			this.set("buttontext", "Save");
			this.set("showdialog", true);
			this.set("isclone", false);
			this.set("dialogrule", null);
			this.set("modaltext", "");
		},
		addRule() {

			if(!this.modaltext || this.modaltext.length == 0) {
				alert('A name must be specified');
				return;
			}

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

				let theUrl = apiBase + "/configuredrules/" + rule.id;  // This 'id' should be the same as the 'ruleset_id'.
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
