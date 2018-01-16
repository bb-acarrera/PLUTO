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

				result.push({
					type: report.get('logType'),
					description: report.get('description'),
					problemFile: report.get('problemFile')
				});
			}

		});

		return result;
	}),

	errorTypesString:  Ember.computed('model.run', function() {
		const err = this.get('model.run.errorcount');
		const warn = this.get('model.run.warningcount');
		const dropped = this.get('model.run.droppedcount');

		let out = '';

		if(err || warn || dropped) {
			out += 'with '
		}

		if(err) {
			out += 'errors';

			if(dropped && warn) {
				out += ', dropped rows, and warnings';
			} else {
				if(dropped) {
					out += ' and dropped rows';
				}
				if(warn) {
					out += ' and warnings';
				}
			}

		} else if(dropped) {
			out += 'dropped rows';
			if(warn) {
				out += ' and warnings';
			}
		} else if(warn) {
			out += 'warnings';
		}


		return out;
	}),

	passed: Ember.computed('model.run.passed', function () {
		return this.get('model.run.passed') === true;
	}),

	failed: Ember.computed('model.run.passed', function () {
		return this.get('model.run.passed') === false;
	}),

	ruleData: Ember.computed('model.ruleset.rules','model.log', function() {
		let rules = this.get('model.ruleset.rules');
		let log = this.get('model.log.meta.ruleState');
		let selectedRuleId = this.get('ruleid');

		function addCounts(rule) {
			rule.warningcount = 0;
			rule.errorcount = 0;
			rule.droppedcount = 0;
			rule.hasAny = false;

			if (log[rule.config.id]) {
				rule.warningcount = log[rule.config.id].warn;
				rule.errorcount = log[rule.config.id].err;
				rule.droppedcount = log[rule.config.id].dropped;
				rule.hasAny = rule.warningcount || rule.errorcount || rule.droppedcount;
			}

			if(selectedRuleId == rule.config.id) {
				rule.selected = true;
			}
		}

		if (Array.isArray(rules)) {

			let items = [];

			let global = {
				name: 'Global Errors',
				filename: 'global',
				config: {
					id: 'global'
				}
			};
			addCounts(global);


			items.push(global);

			rules.forEach(function (origRule) {

				let rule = {
					name: origRule.name,
					filename: origRule.filename,
					config: {
						id: origRule.config.id
					}
				};


				addCounts(rule);

				items.push(rule);
			});

			return items;
		}
		return [];
	}),
	showErrors: null,
	actions: {
		decPage() {

			let page = this.get('page');

			this.set('page', Math.max(page - 1, 1));

		},
		incPage() {

			let page = this.get('page');

			this.set('page', Math.min(page + 1, this.get('totalPages')));

		},
		toggleRowHighlight(rowID, rule) {
			const row = document.getElementById(rowID);

			const selected = row.classList.contains('selected');

			deselectItems(this);

			this.set('page',1);

			if(!selected) {
				row.classList.add('selected');
				this.set('showErrors', rule);
				this.set('ruleid', rule.config.id);
			} else {
				this.set('showErrors', null);
				this.set('ruleid', null);
			}

			this.sendAction('updateFilters');

		},
		toggleErrorType(id, type) {
			const row = document.getElementById(id);

			const selected = row.classList.contains('selected');

			deselectItems(this, 'errorTypes');

			this.set('page', 1);

			if(!selected) {
				row.classList.add('selected');
				this.set('type', type);
			} else {
				this.set('type', null);
			}

			this.sendAction('updateFilters');
		},
		resetType() {
			deselectItems(this);

			this.set('page',1);
			this.set('showErrors', null);
			this.set('ruleid', null);
			this.set('type', null);
		}
	}
});

function deselectItems(c, id) {

	if(!id) {
		id = 'rulesTable';
	}

	const rulesElem = document.getElementById(id);

	const items = rulesElem.childNodes;

	for (var i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.nodeName.toLowerCase() == "tr" && item.classList)
			item.classList.remove('selected');
	}



	c.sendAction('updateFilters');


}
