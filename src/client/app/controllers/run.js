import Ember from 'ember';

export default Ember.Controller.extend({
	queryParams: ["page", "perPage", "ruleid", "type"],

	// set default values, can cause problems if left out
	// if value matches default, it won't display in the URL
	page: 1,
	perPage: 13,
	ruleid: null,
	type: null,
	actions: {
		goBack() {
			window.history.back();
		},

		updateFilters() {

		}
	}
});
