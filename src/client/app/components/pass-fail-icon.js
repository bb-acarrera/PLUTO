import Ember from 'ember';

function getIconClass() {
	let classes = "";


	if(this.get('runcounts.passed') === true) {
		classes = "fa fa-thumbs-up good-color";
	} else if(this.get('runcounts.passed') === false) {
		classes = "fa fa-thumbs-down error-color";
	}

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
	iconTypeObserver: Ember.observer('runcounts', 'runcounts.passed',
		function() {

			const classes =  getIconClass.call(this);

			this.set('icon', classes);
		})
});
