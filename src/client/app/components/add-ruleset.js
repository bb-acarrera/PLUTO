import Ember from 'ember';

export default Ember.Component.extend({
	store: Ember.inject.service('store'),
	router: Ember.inject.service(),
	sourceConfig: {},
	targetConfig: {},
	actions: {
		searchTarget(term) {
			const store = this.get('store');
			return store.query('configuredrule', {
				perPage: 25,
				ruleFilter: term,
				typeFilter: 'target'
			});
		},
		searchSource(term) {
			const store = this.get('store');
			return store.query('configuredrule', {
				perPage: 25,
				ruleFilter: term,
				typeFilter: 'source'
			});
		},
		setSource(source) {
			this.set('source', source);
			this.set('sourceConfig', {});
		},
		setTarget(target) {
			this.set('target', target);
			this.set('targetConfig', {});
		},
		onHidden() {

			this.set('showdialog', false);

			this.set('source', null);
			this.set('target', null);
			this.set('parser', null);
			this.set('sourceConfig', {});
			this.set('targetConfig', {});
		},
		addRuleset() {


			let source = this.get('source');

			if(!source) {
				alert('A source must be specified');
				return;
			}

			const sourceConfig = this.get('sourceConfig');

			let target = null;
			if(!source.get('config.linkedtargetid')) {
				target = this.get('target');

				if(!target) {
					alert('A target must be specified');
					return;
				}

			}

			let parser = this.get('parser');

			if(!parser) {
				if ( !confirm( 'Create without a parser? This cannot be changed once created.' ) ) {
					return;
				}
			}

			this.set("showdialog", false);

			let ruleset = this.get('ruleset');
			if(!ruleset) {
				ruleset = {
					name: source.get('group') + " " + sourceConfig.file
				};
			} else {
				ruleset = ruleset.toJSON();

				ruleset.name = 'Copy of ' + ruleset.name;
			}



			ruleset.source = {
				filename: source.get('rule_id'),
				config: sourceConfig
			};


			if(target) {
				ruleset.target = {
					filename: target.get('rule_id'),
					config: this.get('targetConfig')
				};
			} else {
				ruleset.target = null;
			}

			if(parser) {
				ruleset.parser = {
					filename: parser.get('filename'),
					config: {}
				};
			} else {
				ruleset.parser = null;
			}

			ruleset.importer = null;
			ruleset.exporter = null;

			let group = '';
			if(source.get('group')) {
				group = source.get('group');
			}

			const rulesetId = group + "-" + sourceConfig.file;

			if(!ruleset.name) {
				ruleset.name = sourceConfig.file + ' from ' + (source.get('description') || source.get('rule_id'));
			}


			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = () => {
				if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
					this.get('router').transitionTo('editRuleset', rulesetId);
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

	}
});

