import Ember from 'ember';

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
			title = 'Source';
		} else if(type == 'target') {
			title = 'Target'
		}

		return title;

	}),
	disabled: Ember.computed('model.rule.canedit', function() {
		const canedit = this.get('model.rule.canedit');
		return !canedit;

	}),
	linkedtarget: Ember.computed('model.rule.config.linkedtargetid', function() {
		const type = this.get('model.rule.type');
		if(type === 'source') {
			let targetId = this.get('model.rule.config.linkedtargetid');

			if(targetId) {
				let url = `/configuredrules/${targetId}`;
				return this.get('ajax').request(url).then((resp) => resp.data);
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
				this.set('model.rule.config.linkedtargetid', target.attributes['rule-id']);
			} else {
				this.set('model.rule.config.linkedtargetid', null);
			}

		},
		searchTarget(term) {
			let url = `/configuredrules?perPage=25&typeFilter=target&ruleFilter=${term}`;
			return this.get('ajax').request(url)
				.then((resp) => {
					return resp.data
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

	let theUrl = document.location.origin + "/configuredrules/" + rule.id;
	let theJSON = rule.toJSON();

	xmlHttp.open( "PATCH", theUrl, true ); // true for asynchronous
	xmlHttp.setRequestHeader( "Content-Type", "application/json" );
	xmlHttp.send( JSON.stringify( theJSON ) );

}
