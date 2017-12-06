import Ember from 'ember';

function getIconClass() {
	/*
	 {{#if mixed }}
	 <i class="fa fa-exclamation-triangle warning-and-error-icon"></i>
	 {{else if error }}
	 <i class="fa fa-exclamation-triangle error-icon"></i>
	 {{else if dropped }}
	 <i class="fa fa-ban warning-icon"></i>
	 {{else if warning }}
	 <i class="fa fa-exclamation-triangle warning-icon"></i>
	 {{else if good }}
	 <i class="fa fa-check good-icon"></i>
	 {{/if}}
	 */

	let classes = "";

	if (this.get('runcounts.errorcount') > 0)
		classes = "fa fa-exclamation-triangle error-color";
	else if (this.get('runcounts.droppedcount') > 0)
		classes = "fa fa-ban warning-color";
	else if (this.get('runcounts.warningcount') > 0)
		classes = "fa fa-exclamation-triangle warning-color";

	return classes;
}

export default Ember.Component.extend({
	tagName: 'i',
	classNameBindings: ['icon'],
	icon: '',
	init() {
		this._super(...arguments);
		const classes = getIconClass.call(this);

		this.set('icon', classes);
	},
	iconTypeObserver: Ember.observer('runcounts', 'runcounts.errorcount', 'runcounts.droppedcount', 'runcounts.warningcount',
		function() {

			const classes =  getIconClass.call(this);

			this.set('icon', classes);
		})
});
