import Ember from 'ember';
import moment from 'moment';
import * as Validators from 'ember-changeset-validations/validators';

function startPolling(id) {
	this.set("processing", true);
	let pollId = this.get('poll').addPoll({
		interval: 1000, // one minute
		callback: () => {
			this.store.findRecord('run', id).then(
				run => {
					if (!run.get('isrunning')) {
						this.set("processing", false);
						let rulesetid = this.model.ruleset.get("filename");
						this.replaceRoute("editRuleset.run", rulesetid, id);
					}
				});
		}
	});

	this.set('pollId', pollId);
}
export default Ember.Controller.extend( {
	queryParams: [ "collapsedRun" ],

	applicationController: Ember.inject.controller('application'),

	collapsedRun: false,
	processing: false,

	poll: Ember.inject.service(),

	ruleValidationStates: Ember.computed('model.ruleset', function() {
		// Use "invalid" rather than "valid" to make testing for "disable" easier. (i.e. don't need to negate the value to determine the disable state.)
		return Ember.Object.create({ invalid : false });
	}),

	disableEdit: Ember.computed('model.ruleset.canedit', function() {
		return !this.get('model.ruleset.canedit');
	}),
	ownedBy: Ember.computed('model.ruleset.ownergroup', function() {
		let group = this.get('model.ruleset.ownergroup');
		if(group) return group;

		return 'Nobody';
	}),
	lastEditedBy: Ember.computed('model.ruleset.updateuser', function() {
		let user = this.get('model.ruleset.updateuser');
		if(user) return user;

		return 'Unknown';
	}),
	lastEdited: Ember.computed('model.ruleset.updatetime', function() {
		let changeTime = this.get('model.ruleset.updatetime');

		if(changeTime) {
			return moment(changeTime).format('MMMM Do YYYY, h:mm a');
		}

		return 'Unknown';
	}),
	columns:  Ember.computed('model.ruleset.parser.config.columnNames', function() {

		const columnNames = this.get('model.ruleset.parser.config.columnNames');

		if(!columnNames) {
			return [];
		}

		return columnNames;

	}),
	processURL: Ember.computed('applicationController.currentUser.apiurl', 'model.ruleset.filename', function() {

		const apiBase = this.get('applicationController.currentUser.apiurl');
		const rulesetid = this.get('model.ruleset.filename');

		if(apiBase) {
			return encodeURI(apiBase + 'processfile/' + rulesetid);
		}

		return null;

	}),
	sourceChanged: Ember.observer('model.source', 'model.ruleset.source.filename', function() {
		let modelSource = this.get('model.source.rule_id');
		let rulesetSource = this.get('model.ruleset.source.filename');

		if(modelSource && modelSource == rulesetSource) {
			this.set('source', this.get('model.source'));
		}
	}),

	targetChanged: Ember.observer('model.target', 'model.ruleset.target.filename', function() {
		let modelTarget = this.get('model.target.rule_id');
		let rulesetTarget = this.get('model.ruleset.target.filename');

		if(modelTarget && modelTarget == rulesetTarget) {
			this.set('rulesettarget', this.get('model.target'));
		}
	}),

	// {{applicationController.currentUser.apiUrl}}/processfile/{{url}}
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

			if(!this.get('model.ruleset.source')) {
				let e = Ember.Object.create({filename: null});
				e.set('config', Ember.Object.create({}));

				this.set('model.ruleset.source', e);
			}

			this.set('model.ruleset.source.filename', source.get('rule_id'));
			this.toggleProperty('showChangeSource');

			if(source.get('config.linkedtargetid')) {
				this.set('rulesettarget', null);
				this.set('model.ruleset.target', null);
			}
		},
		setTarget(target) {
			this.set('rulesettarget', target);

			if(!this.get('model.ruleset.target')) {
				let e = Ember.Object.create({filename: null});
				e.set('config', Ember.Object.create({}));

				this.set('model.ruleset.target', e);
			}

			this.set('model.ruleset.target.filename', target.get('rule_id'));
			this.toggleProperty('showChangeTarget');
		},
		toggleUpload (id) {
			startPolling.call(this, id);
		},
		showProcessing(){
			this.set("processing", true);
		},

		saveRuleSet ( ruleset ) {

			save( ruleset, this );
		},

		showAddRule () {
			this.set( 'showAddRule', true );
		},

		hideAddRule () {
			this.set( 'showAddRule', false );
		},

		addRule ( ruleset, rules ) {

			const newRuleFilename = document.getElementById( "selectRule" ).value;
			if ( newRuleFilename == "None" )
				return;

			let newRule = null;

			rules.forEach( rule => {
				if ( rule.get( "filename" ) == newRuleFilename ) {
					newRule = {};
					newRule.filename = rule.get( "filename" );

					var uiConfig = rule.get( 'ui' ).properties;
					var startingConfig = {};
					uiConfig.forEach( config => {
						if ( config.default ) {
							startingConfig[ config.name ] = config.default;
						}
					} );

					newRule.config = Object.assign( {}, rule.get( "config" ) || startingConfig );  // Clone the config. Don't want to reference the original.
					newRule.config.id = createGUID();

					ruleset.get( "rules" ).push( newRule );
					ruleset.notifyPropertyChange( "rules" );
				}
			} );

			this.set( 'showAddRule', false );
			if(newRule) {
				this.set( 'collapseRule' + newRule.config.id, false);
			}

		},

		deleteRule ( rule ) {

			if(!rule) {
				return;
			}

			let ruleToDelete = -1;
			const rules = this.get( 'model.ruleset.rules' );

			if(!rules) {
				return;
			}

			for ( var i = 0; i < rules.length; i++ ) {
				if(rules[i] === rule) {
					ruleToDelete = i;
					break;
				}
			}

			if ( ruleToDelete < 0 ) {
				alert( "No rule selected. Nothing to delete." );
				return;
			}

			let label;
			if(rule.name && rule.name !== rule.filename) {
				label = `${rule.filename} - ${rule.name}`
			} else {
				label = rule.filename;
			}

			if ( confirm( `Delete rule "${label}"?` ) ) {
				rules.splice( ruleToDelete, 1 ); // Remove the rule.
				this.get('model.ruleset').notifyPropertyChange( "rules" );
			}
		},


		moveRuleUp ( ruleset, index ) {
			if ( index < 1 )
				return;

			const rules = ruleset.get( 'rules' );
			const movingRule = rules[ index ];

			rules.splice( index, 1 ); // Remove the rule.
			rules.splice( index - 1, 0, movingRule ); // Add it back one spot earlier.
			ruleset.notifyPropertyChange( "rules" );
		},

		moveRuleDown ( ruleset, index ) {
			const rules = ruleset.get( 'rules' );
			if ( index >= rules.length )
				return;

			const movingRule = rules[ index ];

			rules.splice( index, 1 ); // Remove the rule.
			rules.splice( index + 1, 0, movingRule ); // Add it back one spot later.
			ruleset.notifyPropertyChange( "rules" );
		},


		toggleCollapse ( itemName ) {

			let value = this.get(itemName);
			if(value == null) {
				value = true;
			}

			this.set(itemName, !value)
		},

		isCollapsed ( value ) {

			if(value == null) {
				return true;
			}

			return value == true;
		},

		stopPropagation ( event ) {
			event.stopPropagation();
		},



		getUiProperties(list, itemName) {
			let item = null;

			if(list) {
				list.forEach((i) => {
					if(i.get('filename') == itemName) {
						item = i;
					}
				})
			}

			if(!item)
				return null;

			return item.get('ui.properties');
		},

		getUiValidators(list, itemName) {
			let item = null;

			if(list) {
				list.forEach((i) => {
					if(i.get('filename') == itemName) {
						item = i;
					}
				})
			}

			if(!item)
				return null;

			return item.get('validators');
		},

		getShortDescription(list, itemName) {
			let item = null;

			if(list) {
				list.forEach((i) => {
					if(i.get('filename') == itemName) {
						item = i;
					}
				})
			}

			if(!item)
				return null;

			return item.get('shortdescription');
		},

		getLongDescription(list, itemName) {
			let item = null;

			if(list) {
				list.forEach((i) => {
					if(i.get('filename') == itemName) {
						item = i;
					}
				})
			}

			if(!item)
				return null;

			return item.get('longdescription');
		},

		testRuleset() {
			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = () => {
				if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
					try {
						var jsonResponse = JSON.parse(xmlHttp.responseText);

						if(jsonResponse.runId != null) {
							startPolling.call(this, jsonResponse.runId);
						} else {
							alert('Error processing file: ' + jsonResponse.processing)
						}

					}
					catch (e) {
						console.log("rulesetController.testRuleset() expected a JSON response.\n\t" + e);
					}
				}
				else if (xmlHttp.readyState == 4) {
					alert(`Failed to create: ${xmlHttp.statusText}`);
				}
			};

			let theUrl = document.location.origin + "/processFile/";
			let theJSON = {
				ruleset: this.get('model.ruleset.filename'),
				test: true
			};

			xmlHttp.open("POST", theUrl, true); // true for asynchronous
			xmlHttp.setRequestHeader("Content-Type", "application/json");
			xmlHttp.send(JSON.stringify(theJSON));
		},

		hideTooltip() {
			var tooltip = document.querySelector( ".tooltip" );	// ember-bootstrap uses this in their class name. (Can't see how to assign an ID.)
			if (tooltip)
				tooltip.style.display = 'none';
		}
	}
} );

function save ( ruleset ) {
	var name = document.getElementById( "rulesetName" ).value;
	ruleset.set( "name", name );

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function () {
		if ( xmlHttp.readyState == 4 && xmlHttp.status == 200 ) {
			window.location.reload(true);
			alert( "Successfully saved." );
		}
		else if ( xmlHttp.readyState == 4 ) {
			alert( `Could not save:  ${xmlHttp.statusText}` );
		}
	};

	let theUrl = document.location.origin + "/rulesets/" + ruleset.id;
	let theJSON = ruleset.toJSON();
	// theJSON.id = ruleset.id;

	xmlHttp.open( "PATCH", theUrl, true ); // true for asynchronous
	xmlHttp.setRequestHeader( "Content-Type", "application/json" );
	xmlHttp.send( JSON.stringify( theJSON ) );

}

function createGUID () {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString( 16 );
	} )
}


