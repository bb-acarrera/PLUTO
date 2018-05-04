import Ember from 'ember';
const apiBase = document.location.origin + '/api/v1';

export default Ember.Component.extend({
	store: Ember.inject.service('store'),
	router: Ember.inject.service(),
	sourceConfig: {},
	targetConfig: {},


	errorStates: [],
	invalid: Ember.computed('errorStates.@each.invalid', function() {

		let invalid = false;

		this.get('errorStates').forEach((state) => {
			if(state.get('invalid')) {
				invalid = true;
			}
		});

		return invalid;
	}),

	init() {
        this._super(...arguments);
        this.set('sourceConfig', {});
        this.set('targetConfig', {});
	},

	actions: {
		searchTarget(term) {
			const store = this.get('store');
			return store.query('configuredrule', {
				perPage: 25,
				descriptionFilter: term,
				typeFilter: 'target'
			});
		},
		searchSource(term) {
			const store = this.get('store');
			return store.query('configuredrule', {
				perPage: 25,
				descriptionFilter: term,
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
		addRuleset(validate = true) {


			let source = this.get('source');
			let doValidate =  (typeof validate === 'string')?(validate != "false"):true;

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

			if(doValidate && !parser) {
				if ( !confirm( 'Create without a parser? This cannot be changed once created.' ) ) {
					return;
				}
			}

			let ruleset = this.get('ruleset');
			if(!ruleset) {
				ruleset = {
					name: source.get('description') + " " + sourceConfig.file
				};
			} else {
				ruleset = ruleset.toJSON();

				ruleset.rules = ruleset.rules.filter((val)=>{
					return !val.injected;
				});

				ruleset.name = 'Copy of ' + ruleset.name;
			}



			ruleset.source = {
				filename: source.get('rule_id'),
				config: sourceConfig,
				source: source.get('base')
			};


			if(target) {
				ruleset.target = {
					filename: target.get('rule_id'),
					config: this.get('targetConfig'),
					source: target.get('base')
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

			if(!ruleset.name) {
				ruleset.name = sourceConfig.file + ' from ' + (source.get('description') || source.get('rule_id'));
			}

			ruleset.dovalidate = doValidate;


			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = () => {
				if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {

					this.set("showdialog", false);


					let rulesetId = '';

					try {
						let ruleset = JSON.parse(xmlHttp.response);
						rulesetId = ruleset.ruleset_id;
					} catch (e) {
						console.log(e);
					}

					if(rulesetId) {
						this.get('router').transitionTo('editRuleset', rulesetId);
					}

				}
				else if (xmlHttp.readyState == 4) {
					alert(`Failed to create: ${xmlHttp.statusText}`);
				}
			};

			let theUrl = apiBase + "/rulesets/";
			let theJSON = {
				ruleset: ruleset
			};

			xmlHttp.open("POST", theUrl, true); // true for asynchronous
			xmlHttp.setRequestHeader("Content-Type", "application/json");
			xmlHttp.send(JSON.stringify(theJSON));
		}

	}
});

