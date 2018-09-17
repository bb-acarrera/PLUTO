import Ember from 'ember';

const apiBase = document.location.origin + '/api/v1';

export default Ember.Component.extend({
	router: Ember.inject.service(),
	authGroup: Ember.computed('defaultAuthGroups.length', function() {
		if(this.get('defaultAuthGroups.length') === 1) {
			return this.get('defaultAuthGroups.firstObject');
		}
	}),


	actions: {
		onHidden() {

			this.set('showdialog', false);

			this.set('description', null);
			this.set('base', null);

		},
		setBase(base) {
			this.set('base', base);
		},
		setPrefAuthGroup(prefAuthGroup) {
			this.set('authGroup', prefAuthGroup.name);
		},
		addRule() {

			let description = this.get('description');
			let base = this.get('base');

			if(!description || description.length == 0) {
				alert('A name must be specified');
				return;
			}

			if(!base) {
				alert('A base must be specified');
				return;
			}

			const group = this.get('authGroup');
			// Enforce a group if there are groups to select from
			if(!group && (this.get('defaultAuthGroups.length') || 0) > 0) {
				alert('An owner group must be specified');
				return;
			}


			let rule = {
				type: this.get('type'),
				description: description,
				base: base.get('id'),
				config: {}
			};
			if(group) {
				rule.owner_group = group.get('name');
			}

			var xmlHttp = new XMLHttpRequest();
			xmlHttp.onreadystatechange = () => {
				if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {

					this.set("showdialog", false);


					let ruleId = '';

					try {
						let rule = JSON.parse(xmlHttp.response);
						ruleId = rule.rule_id;
					} catch (e) {
						console.log(e);
					}

					if(ruleId) {
						this.get('router').transitionTo('editConfiguredRule', ruleId);
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


	}


});
