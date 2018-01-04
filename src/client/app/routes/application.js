import Ember from 'ember';

export default Ember.Route.extend({
	routing: Ember.inject.service('-routing'),
	transitionHistory: [],
	transitioningToBack: false,

	actions: {

		willTransition: function(transition) {
			if (!this.get('transitioningToBack')) {
				let history = this.get('transitionHistory');

				let routing = this.get('routing');
				let params = Object.values(transition.params).filter(param => {
					return Object.values(param).length;
				});

				let urlStr = routing.generateURL(transition.targetName, params);
				let url = new URL(window.location.origin + urlStr);

				if(url.pathname !== window.location.pathname) {
					history.push(window.location.pathname + window.location.search);
				}

			}
			this.set('transitioningToBack', false);
		},

		back: function() {
			var last = this.get('transitionHistory').pop();
			last = last ? last : '/runs';
			this.set('transitioningToBack', true);
			this.transitionTo(last);
		}
	}
});
