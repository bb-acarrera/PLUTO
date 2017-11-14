import Ember from 'ember';

export default Ember.Component.extend({
	// binding the property on the paged array
	// to a property on the controller
	totalPages: Ember.computed.oneWay("model.log.meta.totalPages"),

	errorTitle: Ember.computed('showErrors', function(){
		let rule = this.get('showErrors');
		if (rule) {
			if (rule.filename == 'global') {
				return "Global Notifications";
			}else {
				return "Notifications for " + rule.filename;
			}
		} else {
			return "All Notifications";
		}
	}),


	errors: Ember.computed('showErrors','model.log',function(){
		let log  = this.get('model.log').result;
		let rule = this.get('showErrors');

		let ruleID = undefined;

		if(rule && rule.config) {
			ruleID = rule.config.id;
		}

		let result = [];
		log.forEach((report) => {
			if ((ruleID && ruleID == report.get("ruleID")) ||
				(ruleID === "global" && typeof report.get("ruleID") === "undefined") ||
				typeof ruleID === "undefined"){

				result.push({type: report.get('logType'), description: report.get('description')});
			}

		});

		return result;
	}),
	ruleData: Ember.computed('model.ruleset.rules','model.log', function() {
		let rules = this.get('model.ruleset.rules');
		let log = this.get('model.log.meta.ruleState');

		if (Array.isArray(rules)) {

			let items = [];

			items.push({
				name: 'Global Errors',
				filename: 'global',
				config: {
					id: 'global'
				}
			});

			rules.forEach(function (origRule) {

				let rule = {
					name: origRule.name,
					filename: origRule.filename,
					config: {
						id: origRule.config.id
					}
				};


				rule.warningcount = false;
				rule.errorcount = false;
				rule.hasAny = false;

				if (log[rule.config.id]) {
					rule.warningcount = log[rule.config.id].warn;
					rule.errorcount = log[rule.config.id].err;
					rule.hasAny = rule.warningcount || rule.errorcount;
				}

				items.push(rule);
			});

			return items;
		}
		return [];
	}),
	showErrors: null,
	actions: {
		decPage() {
			this.transitionToRoute({queryParams: {page: Math.max(this.page - 1, 1)}});
		},
		incPage() {
			this.transitionToRoute({queryParams: {page: Math.min(this.page + 1, this.get('totalPages'))}});
		},
		toggleRowHighlight(rowID, rule) {
			const row = document.getElementById(rowID);

			const selected = row.classList.contains('selected');

			deselectItems(selected, this);

			if(!selected) {
				row.classList.add('selected');

				this.set('showErrors', rule);
				this.set('page', 1);
				this.set('ruleid', rule.config.id);


			}

			this.sendAction('updateFilters');

		}
	}
});

function deselectItems(clearProperties, c) {
	const rulesElem = document.getElementById('rulesTable');

	const items = rulesElem.childNodes;

	for (var i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.nodeName.toLowerCase() == "tr" && item.classList)
			item.classList.remove('selected');
	}

	if(clearProperties) {
		c.set('showErrors', null);
		c.set('page',1);
		c.set('ruleid', null);
	}

	c.sendAction('updateFilters');


}
