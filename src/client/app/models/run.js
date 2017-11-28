import DS from 'ember-data';

// A rule file, not a rule instance.
export default DS.Model.extend({
	ruleset: DS.attr('string'),
	inputfilename : DS.attr('string'),
	outputfilename : DS.attr('string'),
	log: DS.attr('string'),
	time: DS.attr('date'),
	starttime: DS.attr('date'),
	errorcount: DS.attr('number'),
	warningcount: DS.attr('number'),
	droppedcount: DS.attr('number'),
	isrunning: DS.attr('boolean'),
	version: DS.attr('number'),
	deleted: DS.attr('boolean'),
	group: DS.attr('string'),
	passed: DS.attr('boolean'),
	summary: DS.attr()
});
