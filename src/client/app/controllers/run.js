import Ember from 'ember';

export default Ember.Controller.extend({
	queryParams: ["page", "perPage", "ruleid", "type"],

	applicationController: Ember.inject.controller('application'),

	// set default values, can cause problems if left out
	// if value matches default, it won't display in the URL
	page: 1,
	perPage: 13,
	ruleid: null,
	type: null,

	passed: Ember.computed('model.run.passed', function () {
		return this.get('model.run.passed') === true;
	}),

	failed: Ember.computed('model.run.passed', function () {
		return this.get('model.run.passed') === false;
	}),

	actions: {

		updateFilters() {

		}
	}
});
