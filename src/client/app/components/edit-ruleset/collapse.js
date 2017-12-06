import Ember from 'ember';

export default Ember.Component.extend({
	classNames: ['section-content ruleset-section-content'],
	init() {
		this._super(...arguments);
		let collapsed = this.get('collapsed');
		if(collapsed == null) {
			this.set('collapsed', true);
		}
	},
	actions: {
		toggleCollapse () {

			let collapsed = this.get('collapsed');
			if(collapsed == null) {
				collapsed = true;
			}

			this.set('collapsed', !collapsed)
		}
	}
});
