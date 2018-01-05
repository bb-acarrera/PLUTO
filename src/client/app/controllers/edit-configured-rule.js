import Ember from 'ember';
import moment from 'moment';

const apiBase = document.location.origin + '/api/v1';

export default Ember.Controller.extend({
	ajax: Ember.inject.service(),
	base: Ember.computed('model.rule.base', function() {
		const bases = this.get('bases');
		let base = null;
		let baseId = this.get('model.rule.base');
		bases.forEach((item) => {
			if(item.get && item.get('id') == baseId) {
				base = item;
			}
		});

		return base;

	}),
	bases: Ember.computed('model.rule', function() {
		const type = this.get('model.rule.type');
		let bases = [];

		if(type == 'source') {
			bases = this.get('model.importers');
		} else if(type == 'target') {
			bases = this.get('model.exporters');
		}

		return bases;

	}),
	title: Ember.computed('model.rule.type', function() {
		const type = this.get('model.rule.type');
		let title = '';

		if(type == 'source') {
			title = 'Download Location';
		} else if(type == 'target') {
			title = 'Upload Location'
		}

		return title;

	}),
	disableEdit: Ember.computed('model.rule.canedit', function() {
		const canedit = this.get('model.rule.canedit');
		return !canedit;

	}),
	ownedBy: Ember.computed('model.rule.ownerGroup', function() {
		let group = this.get('model.rule.ownerGroup');
		if(group) return group;

		return 'Nobody';
	}),
	lastEditedBy: Ember.computed('model.rule.updateUser', function() {
		let user = this.get('model.rule.updateUser');
		if(user) return user;

		return 'Unknown';
	}),
	lastEdited: Ember.computed('model.rule.updateTime', function() {
		let changeTime = this.get('model.rule.updateTime');

		if(changeTime) {
			return moment(changeTime).format('MMMM Do YYYY, h:mm a');
		}

		return 'Unknown';
	}),
	linkedtarget: Ember.computed('model.rule.config.linkedtargetid', function() {
		const type = this.get('model.rule.type');
		if(type === 'source') {
			let targetId = this.get('model.rule.config.linkedtargetid');

			if(targetId) {
				return this.store.queryRecord('configuredrule', {id: targetId})
			}
			return null;
		}

		return null;

	}),
	nullValue: null,
	actions: {
		saveRule (  ) {

			save( this );
		},
		chooseTarget (target) {
			if(target) {
				this.set('model.rule.config.linkedtargetid', target.get('rule_id'));
			} else {
				this.set('model.rule.config.linkedtargetid', null);
			}

		},
		searchTarget(term) {
			return this.store.query('configuredrule', {
				perPage: 25,
				descriptionFilter: term,
				typeFilter: 'target'
			});
		},
		chooseBase (base) {
			if(base) {
				this.set('model.rule.base', base.get('id'));
			} else {
				this.set('model.rule.base', null);
			}

		}
	}


});

function save ( controller ) {

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

	const rule = controller.get('model.rule');

	let theUrl = apiBase + "/configuredrules/" + rule.id;
	let theJSON = rule.toJSON();

	xmlHttp.open( "PATCH", theUrl, true ); // true for asynchronous
	xmlHttp.setRequestHeader( "Content-Type", "application/json" );
	xmlHttp.send( JSON.stringify( theJSON ) );

}
