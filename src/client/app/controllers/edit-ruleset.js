import Ember from 'ember';
import moment from 'moment';

export default Ember.Controller.extend( {
	queryParams: [ "collapsedRun" ],
	collapsedRun: false,
	processing: false,

	poll: Ember.inject.service(),


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
	actions: {
		toggleUpload (id) {
			this.set("processing", true);
			let pollId = this.get( 'poll' ).addPoll( {
				interval: 1000, // one minute
				callback: () => {
					this.store.findRecord( 'run', id ).then(
						run => {
							if ( !run.get('isrunning') ) {
								this.set("processing", false);
								let rulesetid = this.model.ruleset.get("filename");
								this.replaceRoute( "editRuleset.run", rulesetid,  id);
							}
						} );
				}
			} );

			this.set( 'pollId', pollId );
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
			//deleteRule( tableID, ruleset );

			if(!rule) {
				return;
			}

			let ruleToDelete = -1;
			const rules = this.get( 'model.ruleset.rules' );

			if(!rules) {
				return;
			}

			for ( var i = 0; i < rules.length; i++ ) {
				if(rules[i].filename === rule.filename) {
					ruleToDelete = i;
					break;
				}
			}

			if ( ruleToDelete < 0 ) {
				alert( "No rule selected. Nothing to delete." );
				return;
			}

			if ( confirm( `Delete rule "${rule.name}"?` ) ) {
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

		chooseTarget (target) {

			if(target) {

				const rulesetTargetConfig = this.get('model.ruleset.target.config').toJSON();

				if(this.get('model.ruleset.target.filename') !== target.get('rule_id')) {

					const newTarget = {
						filename: target.get('rule_id'),
						config: {}
					};

					if(rulesetTargetConfig) {

						target.attributes.ui.properties.forEach((prop) => {
							if(rulesetTargetConfig[prop.name]) {
								newTarget.config[prop.name] = rulesetTargetConfig[prop.name];
							}
						});
					}

					this.set('model.ruleset.target', newTarget);
				}
			} else {
				this.set('model.ruleset.target', null);
			}

		},
		searchTarget(term) {
			return this.store.query('configuredrule', {
				perPage: 25,
				ruleFilter: term,
				typeFilter: 'target'
			});
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
		}

	},
	init: function () {
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
			alert( `Failed to save. Status = ${xmlHttp.status}` );
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


